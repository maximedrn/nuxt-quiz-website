import type { CacheOperations } from '@/server/lib/cache/cache.types'

/**
 * Public cache contract. Consumers type against this, never a concrete driver.
 */
interface ICacheService extends CacheOperations {}

export type { ICacheService }
