import { requireUserId } from '@/server/lib/auth/auth.http'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { toSessionSummary } from '@/server/lib/quiz/quiz.session'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { SessionSummary } from '@/shared/types'

/**
 * Lists the authenticated user's sessions, newest first, each with its
 * answered-question count.
 */
export default defineEventHandler(async (event): Promise<SessionSummary[]> => {
  const userId = requireUserId(event)
  const storage = await useQuizStorage()

  const sessions = await unwrapOrThrow(storage.listSessions(userId))

  return Promise.all(
    sessions.map(async (session) => {
      const answers = await unwrapOrThrow(storage.listAnswers(session.id))
      return toSessionSummary(session, answers.length)
    }),
  )
})
