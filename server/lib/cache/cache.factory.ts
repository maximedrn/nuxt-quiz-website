import is from '@sindresorhus/is'
import { Effect } from 'effect'
import { CacheMessage } from '@/server/lib/cache/cache.message'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import { CacheError, type CacheConfig } from '@/server/lib/cache/cache.types'
import { CacheService } from '@/server/lib/cache/cache.service'
import { BentoCacheDriver } from '@/server/lib/cache/drivers/cache.bentocache.driver'
import { HttpStatus } from '@/server/lib/http/http.status'

/**
 * Builds the cache service (memory L1 + Redis L2).
 *
 * The single entry point for cache construction. Validates the Redis URL before
 * wiring the BentoCache driver. Returns an `Effect` that fails with `CacheError`
 * when the Redis URL is absent.
 *
 * @param {CacheConfig} config - Redis URL and optional L1 size.
 *
 * @returns {Effect.Effect<ICacheService, CacheError>} The service, or a config error.
 *
 * @example
 * ```ts
 * const service = await Effect.runPromise(createCache({ redisUrl: useEnv().config.redisUrl }))
 * ```
 */
function createCache(config: CacheConfig): Effect.Effect<ICacheService, CacheError> {
  if (!is.nonEmptyString(config.redisUrl)) {
    return Effect.fail(new CacheError({ message: CacheMessage.REDIS_URL_MISSING, status: HttpStatus.INTERNAL }))
  }
  return Effect.succeed(new CacheService(new BentoCacheDriver(config)))
}

export { createCache }
