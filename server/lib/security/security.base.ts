import type { ResultAsync } from 'neverthrow'
import type { IRateLimitDriver } from '@/server/lib/security/drivers/security.driver.interface'
import type { IRateLimitService } from '@/server/lib/security/security.interface'
import type { RateLimitKindValue, RateLimitResult } from '@/server/lib/security/security.types'

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

  consume(key: string, kind: RateLimitKindValue): ResultAsync<RateLimitResult, string> {
    return this.driver.consume(key, kind)
  }
}

export { BaseRateLimitService }
