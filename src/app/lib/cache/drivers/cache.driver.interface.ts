import type { CacheOperations } from "@/app/lib/cache/cache.types.ts";

/**
 * Low-level cache backend contract. Interchangeable backends (BentoCache
 * memory+Redis, and any future one) implement this.
 */
interface ICacheDriver extends CacheOperations {}

export type { ICacheDriver };
