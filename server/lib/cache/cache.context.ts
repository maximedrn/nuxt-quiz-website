import { Effect } from 'effect'
import { createCache } from '@/server/lib/cache/cache.factory'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import { useEnv } from '@/server/lib/env/env.context'

let _cache: ICacheService | undefined

/**
 * Lazily-built, process-wide cache service (memory L1 + Redis L2).
 *
 * @returns {ICacheService} The cache service.
 */
export function useCache(): ICacheService {
  if (!_cache) {
    _cache = Effect.runSync(
      createCache({ redisUrl: useEnv().config.redisUrl }).pipe(
        Effect.catchAll((error) =>
          Effect.die(createError({ statusCode: error.status, statusMessage: error.message })),
        ),
      ),
    )
  }
  return _cache
}
