import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisDriver } from 'bentocache/drivers/redis'
import { Duration, Effect, Option, Schedule } from 'effect'
import { Redis } from 'ioredis'
import { CacheMessage } from '@/server/lib/cache/cache.message'
import { type CacheConfig, CacheError } from '@/server/lib/cache/cache.types'
import type { ICacheDriver } from '@/server/lib/cache/drivers/cache.driver.interface'
import { HttpStatus } from '@/server/lib/http/http.status'

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
   * Runs a Redis-touching thunk under an Effect timeout + retry, tagging
   * failures as `CacheError`.
   *
   * @param {string} op - Operation name for error messages.
   * @param {() => Promise<A>} thunk - The cache interaction.
   *
   * @returns {Effect.Effect<A, CacheError>} The value, or a tagged cache error.
   */
  private run<A>(op: string, thunk: () => Promise<A>): Effect.Effect<A, CacheError> {
    return Effect.tryPromise({
      try: thunk,
      catch: (e): CacheError =>
        new CacheError({
          message: `${CacheMessage.OP_FAILED}: ${op}: ${String(e)}`,
          status: HttpStatus.INTERNAL,
        }),
    }).pipe(
      Effect.timeout(OP_TIMEOUT),
      Effect.retry(OP_RETRIES),
      Effect.catchAll(
        (e): Effect.Effect<A, CacheError> =>
          Effect.fail(
            e instanceof CacheError
              ? e
              : new CacheError({
                  message: `${CacheMessage.OP_FAILED}: ${op}`,
                  status: HttpStatus.INTERNAL,
                }),
          ),
      ),
    )
  }

  /**
   * Reads a cached value, or computes+stores it via `factory` on a miss.
   *
   * The `factory` is an Effect; BentoCache's stampede protection ensures it
   * runs at most once per concurrent miss.
   *
   * @param {string} key - Cache key.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   * @param {() => Effect.Effect<A, CacheError>} factory - Value producer on miss.
   *
   * @returns {Effect.Effect<A, CacheError>}
   */
  getOrSet<A>(
    key: string,
    ttlSeconds: number,
    factory: () => Effect.Effect<A, CacheError>,
  ): Effect.Effect<A, CacheError> {
    return this.run('getOrSet', () =>
      this.bento.getOrSet<A>({
        key,
        ttl: `${ttlSeconds}s`,
        factory: () => Effect.runPromise(factory()),
      }),
    )
  }

  /**
   * Stores a value with a TTL.
   *
   * @param {string} key - Cache key.
   * @param {A} value - Value to store.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   *
   * @returns {Effect.Effect<void, CacheError>}
   */
  set<A>(key: string, value: A, ttlSeconds: number): Effect.Effect<void, CacheError> {
    return this.run('set', async () => {
      await this.bento.set({ key, value, ttl: `${ttlSeconds}s` })
    })
  }

  /**
   * Reads a value; `Option.none()` if absent.
   *
   * @param {string} key - Cache key.
   *
   * @returns {Effect.Effect<Option.Option<A>, CacheError>}
   */
  get<A>(key: string): Effect.Effect<Option.Option<A>, CacheError> {
    return this.run('get', () =>
      this.bento.get<A | undefined>({ key, defaultValue: undefined }),
    ).pipe(Effect.map((v): Option.Option<A> => (v === undefined ? Option.none() : Option.some(v))))
  }

  /**
   * Removes a value.
   *
   * @param {string} key - Cache key.
   *
   * @returns {Effect.Effect<void, CacheError>}
   */
  delete(key: string): Effect.Effect<void, CacheError> {
    return this.run('delete', async () => {
      await this.bento.delete({ key })
    })
  }
}

export { BentoCacheDriver }
