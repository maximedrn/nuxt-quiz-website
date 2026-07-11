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
    const result = createCache({ redisUrl: useEnv().config.redisUrl })
    if (result.isErr()) {
      throw createError({ statusCode: 500, statusMessage: result.error })
    }
    _cache = result.value
  }
  return _cache
}
