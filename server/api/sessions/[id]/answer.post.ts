import { Effect } from 'effect'
import type { SubmitAnswerResult } from '@/shared/types'
import { requireUserId } from '@/server/lib/auth/auth.http'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'
import { getOwnedSession } from '@/server/lib/quiz/quiz.session'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { decodeOr400, parseSessionId, submitAnswerSchema } from '@/server/lib/quiz/quiz.validation'
import { invalidateStatsCache } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

/**
 * Records the answer to the session's current question.
 *
 * Enforces strict ordering: the submitted `questionId` must be the next
 * unanswered question, can't be re-answered, and the session must still be open.
 * Grades against the stored key and returns the correct answer + explanation.
 */
export default defineEventHandler(async (event): Promise<SubmitAnswerResult> => {
  const userId: number = requireUserId(event)
  const body: unknown = await readBody(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const id = yield* parseSessionId(getRouterParam(event, 'id'))
      const input = yield* decodeOr400(submitAnswerSchema, body)
      const session = yield* getOwnedSession(storage, id, userId)

      if (session.status === 'completed')
        return yield* Effect.fail(
          new QuizError({ message: QuizMessage.ALREADY_COMPLETED, status: HttpStatus.CONFLICT }),
        )

      const existingAnswers = yield* storage.listAnswers(id)
      const total = session.questionIds.length

      if (existingAnswers.length >= total)
        return yield* Effect.fail(
          new QuizError({ message: QuizMessage.ALREADY_COMPLETED, status: HttpStatus.CONFLICT }),
        )

      const expectedQuestionId = session.questionIds[existingAnswers.length]
      if (input.questionId !== expectedQuestionId)
        return yield* Effect.fail(
          new QuizError({ message: QuizMessage.QUESTION_NOT_IN_SESSION, status: HttpStatus.CONFLICT }),
        )

      if (existingAnswers.some((a) => a.questionId === input.questionId))
        return yield* Effect.fail(
          new QuizError({ message: QuizMessage.ALREADY_ANSWERED, status: HttpStatus.CONFLICT }),
        )

      const questionRows = yield* storage.getQuestionsByIds([input.questionId])
      const question = questionRows[0]
      if (!question)
        return yield* Effect.fail(
          new QuizError({ message: `${QuizMessage.SESSION_NOT_FOUND}: ${input.questionId}`, status: HttpStatus.NOT_FOUND }),
        )

      const isCorrect = input.selected === question.correctAnswer
      yield* storage.createAnswer({
        sessionId: id,
        questionId: input.questionId,
        selected: input.selected,
        isCorrect,
      })
      yield* invalidateStatsCache(userId)

      return {
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        progress: { current: existingAnswers.length + 1, total },
      }
    }),
  )
})
