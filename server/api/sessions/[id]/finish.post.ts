import { requireUserId } from '@/server/lib/auth/auth.http'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { getOwnedSessionOrThrow } from '@/server/lib/quiz/quiz.session'
import { parseSessionId } from '@/server/lib/quiz/quiz.validation'
import { invalidateStatsCache } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { FinishSessionResult } from '@/shared/types'

/**
 * Finalizes a fully-answered session: computes the score, marks it completed
 * and stamps `finishedAt`. Idempotent once completed.
 */
export default defineEventHandler(async (event): Promise<FinishSessionResult> => {
  const userId = requireUserId(event)
  const id = parseSessionId(getRouterParam(event, 'id'))
  const storage = await useQuizStorage()

  const session = await getOwnedSessionOrThrow(storage, id, userId)
  const total = session.questionIds.length

  if (session.status === 'completed') {
    return { score: session.score ?? 0, total }
  }

  const answers = await unwrapOrThrow(storage.listAnswers(id))
  if (answers.length < total) {
    throw createError({
      statusCode: 409,
      statusMessage: `Only ${answers.length}/${total} questions answered — can't finish yet.`,
    })
  }

  const score = answers.filter((a) => a.isCorrect).length
  await unwrapOrThrow(
    storage.updateSession(id, { status: 'completed', score, finishedAt: new Date() }),
  )
  await invalidateStatsCache(userId)

  return { score, total }
})
