import type { IRateLimitDriver } from '@/server/lib/security/drivers/security.driver.interface'
import { BaseRateLimitService } from '@/server/lib/security/security.base'

/**
 * Concrete rate-limit service. Pure delegation via {@link BaseRateLimitService}.
 */
class RateLimitService extends BaseRateLimitService {
  /**
   * @param {IRateLimitDriver} driver - The backing limiter driver.
   */
  constructor(driver: IRateLimitDriver) {
    super(driver)
  }
}

export { RateLimitService }
