import { Effect } from 'effect'
import { requireUserId } from '@/server/lib/auth/auth.session'
import { runOrThrow } from '@/server/lib/http/http.run'
import { toSessionSummary } from '@/server/lib/quiz/quiz.session'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { SessionSummary } from '@/shared/types'

/**
 * Lists the authenticated user's sessions, newest first, each with its
 * answered-question count.
 */
export default defineEventHandler(async (event): Promise<SessionSummary[]> => {
  const userId: number = await requireUserId(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const sessions = yield* storage.listSessions(userId)
      const summaries: SessionSummary[] = []
      for (const session of sessions) {
        const answers = yield* storage.listAnswers(session.id)
        summaries.push(toSessionSummary(session, answers.length))
      }
      return summaries
    }),
  )
})
