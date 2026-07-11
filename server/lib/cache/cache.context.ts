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
    const effect = createCache({ redisUrl: useEnv().config.redisUrl })
    // ponytail: synchronous bootstrap — Effect.runSync would fail on async; factory is sync here
    _cache = Effect.runSync(effect.pipe(
      Effect.catchAll((e) => {
        throw createError({ statusCode: e.status, statusMessage: e.message })
      }),
    ))
  }
  return _cache
}
