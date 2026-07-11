import { CacheKey, CacheTtl } from '@/server/lib/cache/cache.constants'
import { useCache } from '@/server/lib/cache/cache.context'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import type { StatsResult } from '@/shared/types'

/**
 * Returns a user's stats from cache, computing+storing them on a miss.
 *
 * @param {number} userId - The user whose stats are wanted.
 * @param {() => Promise<StatsResult>} compute - Fallback that hits storage.
 *
 * @returns {Promise<StatsResult>} The (possibly cached) stats.
 */
export function cachedStats(
  userId: number,
  compute: () => Promise<StatsResult>,
): Promise<StatsResult> {
  return unwrapOrThrow(useCache().getOrSet(CacheKey.stats(userId), CacheTtl.STATS, compute))
}

/**
 * Invalidates a user's cached stats after their answers change.
 *
 * @param {number} userId - The user whose stats cache to drop.
 *
 * @returns {Promise<void>} Resolves once the key is dropped.
 */
export function invalidateStatsCache(userId: number): Promise<void> {
  return unwrapOrThrow(useCache().delete(CacheKey.stats(userId)))
}

/**
 * Returns the question-bank count from cache, computing+storing it on a miss.
 *
 * @param {() => Promise<number>} compute - Fallback that hits storage.
 *
 * @returns {Promise<number>} The (possibly cached) count.
 */
export function cachedQuestionCount(compute: () => Promise<number>): Promise<number> {
  return unwrapOrThrow(
    useCache().getOrSet(CacheKey.questionCount(), CacheTtl.QUESTION_COUNT, compute),
  )
}
