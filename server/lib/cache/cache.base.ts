import type { Effect, Option } from 'effect'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import type { CacheError } from '@/server/lib/cache/cache.types'
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

  getOrSet<A>(key: string, ttlSeconds: number, factory: () => Effect.Effect<A, CacheError>): Effect.Effect<A, CacheError> {
    return this.driver.getOrSet(key, ttlSeconds, factory)
  }

  set<A>(key: string, value: A, ttlSeconds: number): Effect.Effect<void, CacheError> {
    return this.driver.set(key, value, ttlSeconds)
  }

  get<A>(key: string): Effect.Effect<Option.Option<A>, CacheError> {
    return this.driver.get<A>(key)
  }

  delete(key: string): Effect.Effect<void, CacheError> {
    return this.driver.delete(key)
  }
}

export { BaseCacheService }
