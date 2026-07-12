import type { Effect } from "effect";
import { Data } from "effect";
import type { HttpStatus } from "@/app/lib/http/http.status.ts";
import type { RateLimitKind } from "@/app/lib/security/security.constants.ts";

/**
 * Tagged error for security domain failures.
 */
class SecurityError extends Data.TaggedError("SecurityError")<{
  readonly message: string;
  readonly status: HttpStatus;
}> {}

/**
 * Which limiter a request is charged against.
 *
 * Mirrors the `RateLimitKind` object — exposed as a type alias so callers type
 * their params against `RateLimitKindValue` without reaching into the constants
 * module directly.
 */
type RateLimitKindValue = RateLimitKind;

/**
 * Outcome of consuming one point from a limiter.
 */
interface RateLimitResult {
  /**
   * False once the budget for this key/window is exhausted.
   */
  readonly allowed: boolean;
  /**
   * Milliseconds until the window resets.
   */
  readonly msBeforeNext: number;
  /**
   * Points left in the current window.
   */
  readonly remainingPoints: number;
}

/**
 * One limiter's budget: `points` requests per `duration` seconds.
 */
interface LimiterConfig {
  readonly duration: number;
  readonly points: number;
}

/**
 * Config for both limiters (global throttle + stricter auth).
 */
interface SecurityConfig {
  readonly auth: LimiterConfig;
  readonly global: LimiterConfig;
  readonly redisUrl: string;
}

/**
 * Rate-limit operations.
 */
interface SecurityOperations {
  /**
   * Charges one point against the limiter of `kind` for `key` (typically an
   * IP).
   *
   * @param {string} key - The key to rate-limit (typically an IP address).
   * @param {RateLimitKindValue} kind - Which limiter to charge against.
   *
   * @returns {Effect.Effect<RateLimitResult, SecurityError>} The result or a
   *   security error.
   */
  consume: (
    key: string,
    kind: RateLimitKindValue,
  ) => Effect.Effect<RateLimitResult, SecurityError>;
}

export {
  type LimiterConfig,
  type RateLimitKindValue,
  type RateLimitResult,
  type SecurityConfig,
  SecurityError,
  type SecurityOperations,
};
