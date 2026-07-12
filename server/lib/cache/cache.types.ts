import type { Effect, Option } from 'effect'
import { Data } from 'effect'
import type { HttpStatus } from '@/server/lib/http/http.status'

/** Tagged error for cache domain failures. */
export class CacheError extends Data.TaggedError('CacheError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

/** Config to build a cache backed by memory (L1) + Redis (L2). */
export interface CacheConfig {
  readonly redisUrl: string
  /** Max entries held in the in-memory L1 tier. */
  readonly l1MaxItems?: number
}

/**
 * The cache contract shared by the public service and every driver.
 *
 * Values are serialized JSON; `ttlSeconds` bounds freshness. Nullable reads use
 * `Option`; every operation is fallible and returns an `Effect`.
 */
export interface CacheOperations {
  /**
   * Reads a cached value, or computes+stores it via `factory` on a miss.
   *
   * @param {string} key - Cache key.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   * @param {() => Effect.Effect<A, CacheError>} factory - Value producer on miss.
   *
   * @returns {Effect.Effect<A, CacheError>} The cached or freshly-computed value.
   */
  getOrSet<A>(
    key: string,
    ttlSeconds: number,
    factory: () => Effect.Effect<A, CacheError>,
  ): Effect.Effect<A, CacheError>

  /**
   * Stores a value with a TTL.
   *
   * @param {string} key - Cache key.
   * @param {A} value - Value to store.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   *
   * @returns {Effect.Effect<void, CacheError>}
   */
  set<A>(key: string, value: A, ttlSeconds: number): Effect.Effect<void, CacheError>

  /**
   * Reads a value; `Option.none()` if absent.
   *
   * @param {string} key - Cache key.
   *
   * @returns {Effect.Effect<Option.Option<A>, CacheError>}
   */
  get<A>(key: string): Effect.Effect<Option.Option<A>, CacheError>

  /**
   * Removes a value.
   *
   * @param {string} key - Cache key.
   *
   * @returns {Effect.Effect<void, CacheError>}
   */
  delete(key: string): Effect.Effect<void, CacheError>
}
