import is from '@sindresorhus/is'
import { err, ok, type Result } from 'neverthrow'
import { CacheError } from '@/server/lib/cache/cache.error'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import { CacheService } from '@/server/lib/cache/cache.service'
import type { CacheConfig } from '@/server/lib/cache/cache.types'
import { BentoCacheDriver } from '@/server/lib/cache/drivers/cache.bentocache.driver'

/**
 * Builds the cache service (memory L1 + Redis L2).
 *
 * The single entry point for cache construction. Validates the Redis URL before
 * wiring the BentoCache driver.
 *
 * @param {CacheConfig} config - Redis URL and optional L1 size.
 *
 * @returns {Result<ICacheService, string>} The service, or a config error.
 *
 * @example
 * ```ts
 * const result = createCache({ redisUrl: useEnv().config.redisUrl })
 * if (result.isErr()) throw createError({ statusCode: 500, statusMessage: result.error })
 * ```
 */
function createCache(config: CacheConfig): Result<ICacheService, string> {
  if (!is.nonEmptyString(config.redisUrl)) {
    return err(CacheError.OP_FAILED('createCache', 'REDIS_URL is required'))
  }
  return ok(new CacheService(new BentoCacheDriver(config)))
}

export { createCache }
