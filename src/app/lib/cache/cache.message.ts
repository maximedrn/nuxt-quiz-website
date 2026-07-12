/**
 * Static messages for the cache domain.
 */
const CacheMessage = {
  opFailed: "Cache operation failed",
  redisUrlMissing: "REDIS_URL is required to initialize the cache",
} as const satisfies Record<string, string>;

type CacheMessage = (typeof CacheMessage)[keyof typeof CacheMessage];

export { CacheMessage };
