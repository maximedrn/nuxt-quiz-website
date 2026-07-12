import { Effect } from 'effect'
import type { SessionStateResult } from '@/shared/types'
import { requireUserId } from '@/server/lib/auth/auth.http'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'
import { toPlayableQuestion } from '@/server/lib/quiz/quiz.question'
import { getOwnedSession, toSessionSummary } from '@/server/lib/quiz/quiz.session'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { parseSessionId } from '@/server/lib/quiz/quiz.validation'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

/**
 * Returns the live state of a session: summary, progress, the next unanswered
 * question (answer key stripped), and the correct/incorrect trail so far.
 */
export default defineEventHandler(async (event): Promise<SessionStateResult> => {
  const userId: number = requireUserId(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const id = yield* parseSessionId(getRouterParam(event, 'id'))
      const session = yield* getOwnedSession(storage, id, userId)
      const answers = yield* storage.listAnswers(id)

      const total = session.questionIds.length
      const answeredCount = answers.length
      const summary = toSessionSummary(session, answeredCount)

      const correctByQuestionId = new Map(answers.map((a) => [a.questionId, a.isCorrect]))
      const answeredResults: Array<'correct' | 'incorrect'> = session.questionIds
        .slice(0, answeredCount)
        .map((qid) => (correctByQuestionId.get(qid) ? 'correct' : 'incorrect'))

      if (session.status === 'completed') {
        return {
          session: summary,
          progress: { current: total, total },
          currentQuestion: null,
          needsFinish: false,
          answeredResults,
        }
      }

      if (answeredCount >= total) {
        return {
          session: summary,
          progress: { current: total, total },
          currentQuestion: null,
          needsFinish: true,
          answeredResults,
        }
      }

      const nextQuestionId = session.questionIds[answeredCount]
      if (nextQuestionId === undefined)
        return yield* Effect.fail(
          new QuizError({ message: 'Session question order is corrupted.', status: HttpStatus.INTERNAL }),
        )

      const questionRows = yield* storage.getQuestionsByIds([nextQuestionId])
      const question = questionRows[0]
      if (!question)
        return yield* Effect.fail(
          new QuizError({
            message: 'A question referenced by this session no longer exists.',
            status: HttpStatus.INTERNAL,
          }),
        )

      return {
        session: summary,
        progress: { current: answeredCount + 1, total },
        currentQuestion: toPlayableQuestion(question),
        needsFinish: false,
        answeredResults,
      }
    }),
  )
})
