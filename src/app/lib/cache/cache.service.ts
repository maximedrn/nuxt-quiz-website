import { BaseCacheService } from "@/app/lib/cache/cache.base.ts";

/**
 * Concrete cache service. Pure delegation via {@link BaseCacheService}.
 */
class CacheService extends BaseCacheService {}

export { CacheService };
