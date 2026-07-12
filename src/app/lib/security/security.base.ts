import type { Effect } from "effect";
import type { IRateLimitDriver } from "@/app/lib/security/drivers/security.driver.interface.ts";
import type { IRateLimitService } from "@/app/lib/security/security.interface.ts";
import type {
  RateLimitKindValue,
  RateLimitResult,
  SecurityError,
} from "@/app/lib/security/security.types.ts";

/**
 * Common rate-limit-service logic: holds the driver and delegates to it.
 */
abstract class BaseRateLimitService implements IRateLimitService {
  protected readonly driver: IRateLimitDriver;

  /**
   * @param {IRateLimitDriver} driver - The backing limiter driver.
   */
  constructor(driver: IRateLimitDriver) {
    this.driver = driver;
  }

  /**
   * Delegates to the injected driver.
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
    return this.driver.consume(key, kind);
  }
}

export { BaseRateLimitService };
