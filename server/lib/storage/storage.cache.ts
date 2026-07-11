import { Effect } from 'effect'
import { CacheKey, CacheTtl } from '@/server/lib/cache/cache.constants'
import { useCache } from '@/server/lib/cache/cache.context'
import { CacheError } from '@/server/lib/cache/cache.types'
import type { StorageError } from '@/server/lib/storage/storage.types'
import type { StatsResult } from '@/shared/types'

/**
 * Adapts a `StorageError` into a `CacheError` so a storage-producing effect can
 * be used as a cache `getOrSet` factory (whose error channel is `CacheError`).
 *
 * @param {StorageError} error - The storage failure.
 *
 * @returns {CacheError} The equivalent cache error (same message + status).
 */
function toCacheError(error: StorageError): CacheError {
  return new CacheError({ message: error.message, status: error.status })
}

/**
 * Returns a user's stats from cache, computing+storing them on a miss.
 *
 * @param {number} userId - The user whose stats are wanted.
 * @param {() => Effect.Effect<StatsResult, StorageError>} compute - Storage fallback.
 *
 * @returns {Effect.Effect<StatsResult, CacheError>} The (possibly cached) stats.
 */
export function cachedStats(
  userId: number,
  compute: () => Effect.Effect<StatsResult, StorageError>,
): Effect.Effect<StatsResult, CacheError> {
  return useCache().getOrSet(CacheKey.stats(userId), CacheTtl.STATS, () =>
    compute().pipe(Effect.mapError(toCacheError)),
  )
}

/**
 * Invalidates a user's cached stats after their answers change.
 *
 * @param {number} userId - The user whose stats cache to drop.
 *
 * @returns {Effect.Effect<void, CacheError>} Completes once the key is dropped.
 */
export function invalidateStatsCache(userId: number): Effect.Effect<void, CacheError> {
  return useCache().delete(CacheKey.stats(userId))
}

/**
 * Returns the question-bank count from cache, computing+storing it on a miss.
 *
 * @param {() => Effect.Effect<number, StorageError>} compute - Storage fallback.
 *
 * @returns {Effect.Effect<number, CacheError>} The (possibly cached) count.
 */
export function cachedQuestionCount(
  compute: () => Effect.Effect<number, StorageError>,
): Effect.Effect<number, CacheError> {
  return useCache().getOrSet(CacheKey.questionCount(), CacheTtl.QUESTION_COUNT, () =>
    compute().pipe(Effect.mapError(toCacheError)),
  )
}
