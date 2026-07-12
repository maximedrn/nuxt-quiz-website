import { Effect } from 'effect'
import { type RateLimiterAbstract, RateLimiterRes } from 'rate-limiter-flexible'
import { match } from 'ts-pattern'
import type { IRateLimitDriver } from '@/server/lib/security/drivers/security.driver.interface'
import { RateLimitKind } from '@/server/lib/security/security.constants'
import { SecurityMessage } from '@/server/lib/security/security.message'
import { HttpStatus } from '@/server/lib/http/http.status'
import { SecurityError, type RateLimitKindValue, type RateLimitResult } from '@/server/lib/security/security.types'

/** The two limiters this driver charges against. */
interface Limiters {
  readonly global: RateLimiterAbstract
  readonly auth: RateLimiterAbstract
}

/**
 * Rate-limit driver backed by `rate-limiter-flexible`.
 *
 * The limiters are injected (Redis-backed in production, in-memory in tests).
 * The library signals "blocked" by *rejecting* with a `RateLimiterRes`; that's
 * translated into `allowed: false` rather than a thrown error — only genuine
 * failures (e.g. Redis down) surface as a `SecurityError`.
 */
class FlexibleRateLimitDriver implements IRateLimitDriver {
  private readonly limiters: Limiters

  /**
   * @param {Limiters} limiters - Configured global + auth limiters.
   */
  constructor(limiters: Limiters) {
    this.limiters = limiters
  }

  /**
   * Charges one point against the selected limiter for `key`.
   *
   * A `RateLimiterRes` rejection (over-budget signal) is translated to
   * `allowed: false`; real errors are tagged as `SecurityError`.
   *
   * @param {string} key - The key to rate-limit (typically an IP address).
   * @param {RateLimitKindValue} kind - Which limiter to charge against.
   *
   * @returns {Effect.Effect<RateLimitResult, SecurityError>} The result or a security error.
   */
  consume(key: string, kind: RateLimitKindValue): Effect.Effect<RateLimitResult, SecurityError> {
    const limiter = match(kind)
      .with(RateLimitKind.AUTH, () => this.limiters.auth)
      .with(RateLimitKind.GLOBAL, () => this.limiters.global)
      .exhaustive()

    // The RateLimiterRes-rejection-to-allowed:false translation stays inside a
    // plain promise; Effect.tryPromise then wraps it, tagging real failures.
    const settle: Promise<RateLimitResult> = limiter
      .consume(key)
      .then((res) => ({
        allowed: true,
        remainingPoints: res.remainingPoints,
        msBeforeNext: res.msBeforeNext,
      }))
      // A RateLimiterRes rejection means "over budget", not a failure.
      .catch((rejection) => {
        if (rejection instanceof RateLimiterRes) {
          return {
            allowed: false,
            remainingPoints: rejection.remainingPoints,
            msBeforeNext: rejection.msBeforeNext,
          }
        }
        throw rejection instanceof Error ? rejection : new Error(String(rejection))
      })

    return Effect.tryPromise({
      try: () => settle,
      catch: (e): SecurityError =>
        new SecurityError({
          message: `${SecurityMessage.CONSUME_FAILED}: ${e instanceof Error ? e.message : String(e)}`,
          status: HttpStatus.INTERNAL,
        }),
    })
  }
}

export type { Limiters }
export { FlexibleRateLimitDriver }
