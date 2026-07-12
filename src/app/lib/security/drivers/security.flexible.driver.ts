import { Effect } from "effect";
import {
  type RateLimiterAbstract,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { match } from "ts-pattern";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import type { IRateLimitDriver } from "@/app/lib/security/drivers/security.driver.interface.ts";
import { RateLimitKind } from "@/app/lib/security/security.constants.ts";
import { SecurityMessage } from "@/app/lib/security/security.message.ts";
import {
  type RateLimitKindValue,
  type RateLimitResult,
  SecurityError,
} from "@/app/lib/security/security.types.ts";

/**
 * The two limiters this driver charges against.
 */
interface Limiters {
  readonly auth: RateLimiterAbstract;
  readonly global: RateLimiterAbstract;
}

/**
 * Rate-limit driver backed by `rate-limiter-flexible`.
 *
 * The limiters are injected (Redis-backed in production, in-memory in tests).
 * The library signals "blocked" by _rejecting_ with a `RateLimiterRes`; that's
 * translated into `allowed: false` rather than a thrown error — only genuine
 * failures (e.g. Redis down) surface as a `SecurityError`.
 */
class FlexibleRateLimitDriver implements IRateLimitDriver {
  private readonly limiters: Limiters;

  /**
   * @param {Limiters} limiters - Configured global + auth limiters.
   */
  constructor(limiters: Limiters) {
    this.limiters = limiters;
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
   * @returns {Effect.Effect<RateLimitResult, SecurityError>} The result or a
   *   security error.
   */
  consume(
    key: string,
    kind: RateLimitKindValue,
  ): Effect.Effect<RateLimitResult, SecurityError> {
    const limiter: RateLimiterAbstract = match(kind)
      .with(RateLimitKind.auth, () => this.limiters.auth)
      .with(RateLimitKind.global, () => this.limiters.global)
      .exhaustive();

    // The RateLimiterRes-rejection-to-allowed:false translation stays inside a
    // plain promise; Effect.tryPromise then wraps it, tagging real failures.
    const settle: Promise<RateLimitResult> = limiter
      .consume(key)
      .then((result: RateLimiterRes): RateLimitResult => ({
        allowed: true,
        msBeforeNext: result.msBeforeNext,
        remainingPoints: result.remainingPoints,
      }))
      // A RateLimiterRes rejection means "over budget", not a failure.
      .catch((rejection: unknown): RateLimitResult => {
        if (rejection instanceof RateLimiterRes) {
          return {
            allowed: false,
            msBeforeNext: rejection.msBeforeNext,
            remainingPoints: rejection.remainingPoints,
          };
        }
        if (rejection instanceof Error) {
          throw rejection;
        }
        throw new Error(String(rejection));
      });

    return Effect.tryPromise({
      catch: (error: unknown): SecurityError => {
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }
        return new SecurityError({
          message: `${SecurityMessage.consumeFailed}: ${errorMessage}`,
          status: HttpStatus.internal,
        });
      },
      try: () => settle,
    });
  }
}

export { FlexibleRateLimitDriver, type Limiters };
