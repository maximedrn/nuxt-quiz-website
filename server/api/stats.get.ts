import { requireUserId } from '@/server/lib/auth/auth.http'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { cachedStats } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { StatsResult } from '@/shared/types'

/**
 * Returns the authenticated user's aggregate stats (accuracy, streak, score
 * trend, weakest questions). Aggregation lives in the storage layer so it works
 * identically across the Postgres and blockchain backends, and is cached.
 */
export default defineEventHandler(async (event): Promise<StatsResult> => {
  const userId = requireUserId(event)
  const storage = await useQuizStorage()
  return cachedStats(userId, () => unwrapOrThrow(storage.getStats(userId)))
})
