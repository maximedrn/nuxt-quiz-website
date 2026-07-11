import type { ResultAsync } from 'neverthrow'
import type { Option } from 'option-t/plain_option'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import type { ICacheDriver } from '@/server/lib/cache/drivers/cache.driver.interface'

/**
 * Common cache-service logic: holds the driver and delegates each operation to
 * it. Concrete services extend this.
 */
abstract class BaseCacheService implements ICacheService {
  protected readonly driver: ICacheDriver

  /**
   * @param {ICacheDriver} driver - The backing cache driver.
   */
  protected constructor(driver: ICacheDriver) {
    this.driver = driver
  }

  getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): ResultAsync<T, string> {
    return this.driver.getOrSet(key, ttlSeconds, factory)
  }

  set<T>(key: string, value: T, ttlSeconds: number): ResultAsync<void, string> {
    return this.driver.set(key, value, ttlSeconds)
  }

  get<T>(key: string): ResultAsync<Option<T>, string> {
    return this.driver.get<T>(key)
  }

  delete(key: string): ResultAsync<void, string> {
    return this.driver.delete(key)
  }
}

export { BaseCacheService }
