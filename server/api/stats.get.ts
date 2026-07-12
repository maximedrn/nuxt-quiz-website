import { Effect } from 'effect'
import type { StatsResult } from '@/shared/types'
import { requireUserId } from '@/server/lib/auth/auth.http'
import { runOrThrow } from '@/server/lib/http/http.run'
import { cachedStats } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

/**
 * Returns the authenticated user's aggregate stats (accuracy, streak, score
 * trend, weakest questions). Aggregation lives in the storage layer so it works
 * identically across the Postgres and blockchain backends, and is cached.
 */
export default defineEventHandler(async (event): Promise<StatsResult> => {
  const userId: number = requireUserId(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      return yield* cachedStats(userId, () => storage.getStats(userId))
    }),
  )
})
