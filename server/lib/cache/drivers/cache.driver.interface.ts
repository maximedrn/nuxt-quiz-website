import type { CacheOperations } from '@/server/lib/cache/cache.types'

/**
 * Low-level cache backend contract. Interchangeable backends (BentoCache
 * memory+Redis, and any future one) implement this.
 */
interface ICacheDriver extends CacheOperations {}

export type { ICacheDriver }
