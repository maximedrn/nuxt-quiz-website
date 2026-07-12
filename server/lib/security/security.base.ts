import type { Effect } from 'effect'
import type { IRateLimitDriver } from '@/server/lib/security/drivers/security.driver.interface'
import type { IRateLimitService } from '@/server/lib/security/security.interface'
import type {
  RateLimitKindValue,
  RateLimitResult,
  SecurityError,
} from '@/server/lib/security/security.types'

/**
 * Common rate-limit-service logic: holds the driver and delegates to it.
 */
abstract class BaseRateLimitService implements IRateLimitService {
  protected readonly driver: IRateLimitDriver

  /**
   * @param {IRateLimitDriver} driver - The backing limiter driver.
   */
  protected constructor(driver: IRateLimitDriver) {
    this.driver = driver
  }

  /**
   * Delegates to the injected driver.
   *
   * @param {string} key - The key to rate-limit (typically an IP address).
   * @param {RateLimitKindValue} kind - Which limiter to charge against.
   *
   * @returns {Effect.Effect<RateLimitResult, SecurityError>} The result or a security error.
   */
  consume(key: string, kind: RateLimitKindValue): Effect.Effect<RateLimitResult, SecurityError> {
    return this.driver.consume(key, kind)
  }
}

export { BaseRateLimitService }
