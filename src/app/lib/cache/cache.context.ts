import { Effect } from "effect";
import { createCache } from "@/app/lib/cache/cache.factory.ts";
import type { ICacheService } from "@/app/lib/cache/cache.interface.ts";
import type { CacheError } from "@/app/lib/cache/cache.types.ts";
import { useEnv } from "@/app/lib/env/env.context.ts";
import type { IEnvService } from "@/app/lib/env/env.interface.ts";

let _cache: ICacheService | undefined;

/**
 * Lazily-built, process-wide cache service (memory L1 + Redis L2).
 *
 * @returns {ICacheService} The cache service.
 */
const useCache: () => ICacheService = (): ICacheService => {
  if (!_cache) {
    const env: IEnvService = useEnv();
    _cache = Effect.runSync(
      createCache({ redisUrl: env.config.redisUrl }).pipe(
        Effect.catchAll((error: CacheError): Effect.Effect<never, CacheError> =>
          Effect.die(
            createError({
              statusCode: error.status,
              statusMessage: error.message,
            }),
          ),
        ),
      ),
    );
  }
  return _cache;
};

export { useCache };
