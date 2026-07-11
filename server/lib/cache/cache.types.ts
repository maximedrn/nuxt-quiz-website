import type { ResultAsync } from 'neverthrow'
import type { Option } from 'option-t/plain_option'

/** Config to build a cache backed by memory (L1) + Redis (L2). */
interface CacheConfig {
  readonly redisUrl: string
  /** Max entries held in the in-memory L1 tier. */
  readonly l1MaxItems?: number
}

/**
 * The cache contract shared by the public service and every driver.
 *
 * Values are serialized JSON; `ttlSeconds` bounds freshness. Nullable reads use
 * `Option`; every operation is fallible and returns a `ResultAsync`.
 */
interface CacheOperations {
  /** Reads a cached value, or computes+stores it via `factory` on a miss. */
  getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): ResultAsync<T, string>
  /** Stores a value with a TTL. */
  set<T>(key: string, value: T, ttlSeconds: number): ResultAsync<void, string>
  /** Reads a value, `None` if absent. */
  get<T>(key: string): ResultAsync<Option<T>, string>
  /** Removes a value. */
  delete(key: string): ResultAsync<void, string>
}

export type { CacheConfig, CacheOperations }
