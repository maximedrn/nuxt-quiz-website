import { Effect } from 'effect'
import type { FinishSessionResult } from '@/shared/types'
import { requireUserId } from '@/server/lib/auth/auth.http'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'
import { getOwnedSession } from '@/server/lib/quiz/quiz.session'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { parseSessionId } from '@/server/lib/quiz/quiz.validation'
import { invalidateStatsCache } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

/**
 * Finalizes a fully-answered session: computes the score, marks it completed
 * and stamps `finishedAt`. Idempotent once completed.
 */
export default defineEventHandler(async (event): Promise<FinishSessionResult> => {
  const userId: number = requireUserId(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const id = yield* parseSessionId(getRouterParam(event, 'id'))
      const session = yield* getOwnedSession(storage, id, userId)
      const total = session.questionIds.length

      if (session.status === 'completed') {
        return { score: session.score ?? 0, total }
      }

      const answers = yield* storage.listAnswers(id)
      if (answers.length < total)
        return yield* Effect.fail(
          new QuizError({
            message: `${QuizMessage.QUESTION_NOT_IN_SESSION}: ${answers.length}/${total} answered`,
            status: HttpStatus.CONFLICT,
          }),
        )

      const score = answers.filter((a) => a.isCorrect).length
      yield* storage.updateSession(id, { status: 'completed', score, finishedAt: new Date() })
      yield* invalidateStatsCache(userId)

      return { score, total }
    }),
  )
})
