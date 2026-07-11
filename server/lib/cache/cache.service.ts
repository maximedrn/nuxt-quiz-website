import { BaseCacheService } from '@/server/lib/cache/cache.base'
import type { ICacheDriver } from '@/server/lib/cache/drivers/cache.driver.interface'

/**
 * Concrete cache service. Pure delegation via {@link BaseCacheService}.
 */
class CacheService extends BaseCacheService {
  /**
   * @param {ICacheDriver} driver - The backing cache driver.
   */
  constructor(driver: ICacheDriver) {
    super(driver)
  }
}

export { CacheService }
