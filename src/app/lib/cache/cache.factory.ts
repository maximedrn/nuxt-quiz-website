import is from "@sindresorhus/is";
import { Effect } from "effect";
import type { ICacheService } from "@/app/lib/cache/cache.interface.ts";
import { CacheMessage } from "@/app/lib/cache/cache.message.ts";
import { CacheService } from "@/app/lib/cache/cache.service.ts";
import { type CacheConfig, CacheError } from "@/app/lib/cache/cache.types.ts";
import { BentoCacheDriver } from "@/app/lib/cache/drivers/cache.bentocache.driver.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Builds the cache service (memory L1 + Redis L2).
 *
 * The single entry point for cache construction. Validates the Redis URL before
 * wiring the BentoCache driver. Returns an `Effect` that fails with
 * `CacheError` when the Redis URL is absent.
 *
 * @param {CacheConfig} config - Redis URL and optional L1 size.
 *
 * @returns {Effect.Effect<ICacheService, CacheError>} The service, or a config
 *   error.
 */
const createCache: (
  config: CacheConfig,
) => Effect.Effect<ICacheService, CacheError> = (
  config: CacheConfig,
): Effect.Effect<ICacheService, CacheError> => {
  if (!is.nonEmptyString(config.redisUrl)) {
    return Effect.fail(
      new CacheError({
        message: CacheMessage.redisUrlMissing,
        status: HttpStatus.internal,
      }),
    );
  }
  return Effect.succeed(new CacheService(new BentoCacheDriver(config)));
};

export { createCache };
