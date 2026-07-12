import { Effect } from 'effect'
import type { ReviewItem, SessionResultsResult } from '@/shared/types'
import { requireUserId } from '@/server/lib/auth/auth.session'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'
import { getOwnedSession, toSessionSummary } from '@/server/lib/quiz/quiz.session'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { parseSessionId } from '@/server/lib/quiz/quiz.validation'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

/**
 * Returns the full post-session review: every question with its options, the
 * correct answer, the user's choice and the explanation. Only for completed
 * sessions.
 */
export default defineEventHandler(async (event): Promise<SessionResultsResult> => {
  const userId: number = await requireUserId(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const id = yield* parseSessionId(getRouterParam(event, 'id'))
      const session = yield* getOwnedSession(storage, id, userId)

      if (session.status !== 'completed')
        return yield* Effect.fail(
          new QuizError({ message: QuizMessage.ALREADY_COMPLETED, status: HttpStatus.CONFLICT }),
        )

      const answers = yield* storage.listAnswers(id)
      const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]))

      const questionRows =
        session.questionIds.length > 0 ? yield* storage.getQuestionsByIds(session.questionIds) : []
      const questionById = new Map(questionRows.map((q) => [q.id, q]))

      const items: ReviewItem[] = []
      for (const qid of session.questionIds) {
        const question = questionById.get(qid)
        const answer = answerByQuestionId.get(qid)
        if (!question || !answer)
          return yield* Effect.fail(
            new QuizError({
              message: `${QuizMessage.SESSION_NOT_FOUND}: missing data for question ${qid} in session ${id}`,
              status: HttpStatus.INTERNAL,
            }),
          )
        items.push({
          number: question.number,
          title: question.title,
          question: question.question,
          code: question.code,
          options: {
            A: question.optionA,
            B: question.optionB,
            C: question.optionC,
            D: question.optionD,
          },
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          selected: answer.selected,
          isCorrect: answer.isCorrect,
        })
      }

      return { session: toSessionSummary(session, answers.length), items }
    }),
  )
})
