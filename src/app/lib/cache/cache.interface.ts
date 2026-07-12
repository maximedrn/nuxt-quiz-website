import type { CacheOperations } from "@/app/lib/cache/cache.types.ts";

/**
 * Public cache contract. Consumers type against this, never a concrete driver.
 */
interface ICacheService extends CacheOperations {}

export type { ICacheService };
