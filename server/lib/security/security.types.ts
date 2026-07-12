import type { Effect } from 'effect'
import { Data } from 'effect'
import type { HttpStatus } from '@/server/lib/http/http.status'
import type { RateLimitKind } from '@/server/lib/security/security.constants'

/** Tagged error for security domain failures. */
export class SecurityError extends Data.TaggedError('SecurityError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

/** Which limiter a request is charged against. */
type RateLimitKindValue = (typeof RateLimitKind)[keyof typeof RateLimitKind]

/** Outcome of consuming one point from a limiter. */
interface RateLimitResult {
  /** False once the budget for this key/window is exhausted. */
  readonly allowed: boolean
  /** Points left in the current window. */
  readonly remainingPoints: number
  /** Milliseconds until the window resets. */
  readonly msBeforeNext: number
}

/** One limiter's budget: `points` requests per `duration` seconds. */
interface LimiterConfig {
  readonly points: number
  readonly duration: number
}

/** Config for both limiters (global throttle + stricter auth). */
interface SecurityConfig {
  readonly redisUrl: string
  readonly global: LimiterConfig
  readonly auth: LimiterConfig
}

/** Rate-limit operations. */
interface SecurityOperations {
  /**
   * Charges one point against the limiter of `kind` for `key` (typically an IP).
   *
   * @param {string} key - The key to rate-limit (typically an IP address).
   * @param {RateLimitKindValue} kind - Which limiter to charge against.
   *
   * @returns {Effect.Effect<RateLimitResult, SecurityError>} The result or a security error.
   */
  consume(key: string, kind: RateLimitKindValue): Effect.Effect<RateLimitResult, SecurityError>
}

export type {
  LimiterConfig,
  RateLimitKindValue,
  RateLimitResult,
  SecurityConfig,
  SecurityOperations,
}
