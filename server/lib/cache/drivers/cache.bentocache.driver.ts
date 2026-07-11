import is from '@sindresorhus/is'
import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisDriver } from 'bentocache/drivers/redis'
import { Duration, Effect, Schedule } from 'effect'
import { Redis } from 'ioredis'
import { ResultAsync } from 'neverthrow'
import { createNone, createSome, type Option } from 'option-t/plain_option'
import { CacheError } from '@/server/lib/cache/cache.error'
import type { CacheConfig } from '@/server/lib/cache/cache.types'
import type { ICacheDriver } from '@/server/lib/cache/drivers/cache.driver.interface'

const DEFAULT_L1_MAX_ITEMS = 500
/** Per-op timeout and retry policy for the Redis (L2) tier. */
const OP_TIMEOUT = Duration.seconds(2)
const OP_RETRIES = Schedule.recurs(2)

/**
 * Two-tier cache driver: in-memory L1 in front of a Redis L2, via BentoCache.
 *
 * Point reads/writes to Redis are wrapped in an Effect with a timeout and a
 * bounded retry, so a momentarily slow Redis degrades gracefully instead of
 * hanging a request. `getOrSet` relies on BentoCache's own stampede protection.
 */
class BentoCacheDriver implements ICacheDriver {
  private readonly bento: BentoCache<Record<string, never>>
  private readonly redis: Redis

  /**
   * @param {CacheConfig} config - Redis URL and optional L1 size.
   */
  constructor(config: CacheConfig) {
    this.redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 2, lazyConnect: false })
    this.bento = new BentoCache({
      default: 'multitier',
      stores: {
        multitier: bentostore()
          .useL1Layer(memoryDriver({ maxItems: config.l1MaxItems ?? DEFAULT_L1_MAX_ITEMS }))
          .useL2Layer(redisDriver({ connection: this.redis })),
      },
    })
  }

  /**
   * Runs a Redis-touching thunk under an Effect timeout + retry, exposed as a
   * `ResultAsync`.
   *
   * @param {string} op - Operation name for error messages.
   * @param {() => Promise<T>} thunk - The cache interaction.
   *
   * @returns {ResultAsync<T, string>} The value, or a cache error.
   */
  private run<T>(op: string, thunk: () => Promise<T>): ResultAsync<T, string> {
    const effect = Effect.tryPromise({
      try: thunk,
      catch: (err) => (err instanceof Error ? err : new Error(String(err))),
    }).pipe(Effect.timeout(OP_TIMEOUT), Effect.retry(OP_RETRIES))

    return ResultAsync.fromPromise(Effect.runPromise(effect), (err) =>
      CacheError.OP_FAILED(op, err instanceof Error ? err.message : String(err)),
    )
  }

  getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): ResultAsync<T, string> {
    return ResultAsync.fromPromise(
      this.bento.getOrSet<T>({ key, factory, ttl: `${ttlSeconds}s` }),
      (err) => CacheError.OP_FAILED('getOrSet', err instanceof Error ? err.message : String(err)),
    )
  }

  set<T>(key: string, value: T, ttlSeconds: number): ResultAsync<void, string> {
    return this.run('set', async () => {
      await this.bento.set({ key, value, ttl: `${ttlSeconds}s` })
    })
  }

  get<T>(key: string): ResultAsync<Option<T>, string> {
    return this.run('get', async () => {
      const value = await this.bento.get<T | undefined>({ key, defaultValue: undefined })
      return is.undefined(value) ? createNone() : createSome(value)
    })
  }

  delete(key: string): ResultAsync<void, string> {
    return this.run('delete', async () => {
      await this.bento.delete({ key })
    })
  }
}

export { BentoCacheDriver }
