import { ResultAsync } from 'neverthrow'
import { type RateLimiterAbstract, RateLimiterRes } from 'rate-limiter-flexible'
import { match } from 'ts-pattern'
import type { IRateLimitDriver } from '@/server/lib/security/drivers/security.driver.interface'
import { RateLimitKind } from '@/server/lib/security/security.constants'
import { SecurityError } from '@/server/lib/security/security.error'
import type { RateLimitKindValue, RateLimitResult } from '@/server/lib/security/security.types'

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
 * failures (e.g. Redis down) surface as a `Result` error.
 */
class FlexibleRateLimitDriver implements IRateLimitDriver {
  private readonly limiters: Limiters

  /**
   * @param {Limiters} limiters - Configured global + auth limiters.
   */
  constructor(limiters: Limiters) {
    this.limiters = limiters
  }

  consume(key: string, kind: RateLimitKindValue): ResultAsync<RateLimitResult, string> {
    const limiter = match(kind)
      .with(RateLimitKind.AUTH, () => this.limiters.auth)
      .with(RateLimitKind.GLOBAL, () => this.limiters.global)
      .exhaustive()

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

    return ResultAsync.fromPromise(settle, (err) =>
      SecurityError.CONSUME_FAILED(err instanceof Error ? err.message : String(err)),
    )
  }
}

export type { Limiters }
export { FlexibleRateLimitDriver }
