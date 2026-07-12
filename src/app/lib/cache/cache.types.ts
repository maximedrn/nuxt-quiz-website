import type { Effect, Option } from "effect";
import { Data } from "effect";
import type { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Tagged error for cache domain failures.
 */
class CacheError extends Data.TaggedError("CacheError")<{
  readonly message: string;
  readonly status: HttpStatus;
}> {}

/**
 * Config to build a cache backed by memory (L1) + Redis (L2).
 */
interface CacheConfig {
  /**
   * Max entries held in the in-memory L1 tier.
   */
  readonly l1MaxItems?: number;
  readonly redisUrl: string;
}

/**
 * The cache contract shared by the public service and every driver.
 *
 * Values are serialized JSON; `ttlSeconds` bounds freshness. Nullable reads use
 * `Option`; every operation is fallible and returns an `Effect`.
 */
interface CacheOperations {
  /**
   * Removes a value.
   *
   * @param {string} key - Cache key.
   *
   * @returns {Effect.Effect<void, CacheError>}
   */
  delete: (key: string) => Effect.Effect<void, CacheError>;

  /**
   * Reads a value; `Option.none()` if absent.
   *
   * @param {string} key - Cache key.
   *
   * @returns {Effect.Effect<Option.Option<A>, CacheError>}
   */
  get: <A>(key: string) => Effect.Effect<Option.Option<A>, CacheError>;
  /**
   * Reads a cached value, or computes+stores it via `factory` on a miss.
   *
   * @param {string} key - Cache key.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   * @param {() => Effect.Effect<A, CacheError>} factory - Value producer on
   *   miss.
   *
   * @returns {Effect.Effect<A, CacheError>} The cached or freshly-computed
   *   value.
   */
  getOrSet: <A>(
    key: string,
    ttlSeconds: number,
    factory: () => Effect.Effect<A, CacheError>,
  ) => Effect.Effect<A, CacheError>;

  /**
   * Stores a value with a TTL.
   *
   * @param {string} key - Cache key.
   * @param {A} value - Value to store.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   *
   * @returns {Effect.Effect<void, CacheError>}
   */
  set: <A>(
    key: string,
    value: A,
    ttlSeconds: number,
  ) => Effect.Effect<void, CacheError>;
}

export { type CacheConfig, CacheError, type CacheOperations };
