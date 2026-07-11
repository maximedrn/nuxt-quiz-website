import type { ResultAsync } from 'neverthrow'
import type { RateLimitKind } from '@/server/lib/security/security.constants'

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
   */
  consume(key: string, kind: RateLimitKindValue): ResultAsync<RateLimitResult, string>
}

export type {
  LimiterConfig,
  RateLimitKindValue,
  RateLimitResult,
  SecurityConfig,
  SecurityOperations,
}
