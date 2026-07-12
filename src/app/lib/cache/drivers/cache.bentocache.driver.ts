import is from "@sindresorhus/is";
import { BentoCache, bentostore } from "bentocache";
import { memoryDriver } from "bentocache/drivers/memory";
import { redisDriver } from "bentocache/drivers/redis";
import { Duration, Effect, Option, Schedule } from "effect";
import { Redis } from "ioredis";
import { CacheOp } from "@/app/lib/cache/cache.constants.ts";
import { CacheMessage } from "@/app/lib/cache/cache.message.ts";
import { type CacheConfig, CacheError } from "@/app/lib/cache/cache.types.ts";
import type { ICacheDriver } from "@/app/lib/cache/drivers/cache.driver.interface.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

const DEFAULT_L1_MAX_ITEMS: number = 500;
/**
 * Per-op timeout for the Redis (L2) tier.
 */
const OP_TIMEOUT: Duration.Duration = Duration.seconds(2);
/**
 * Per-op retry policy for the Redis (L2) tier.
 */
const OP_RETRIES: Schedule.Schedule<number> = Schedule.recurs(2);

/**
 * Two-tier cache driver: in-memory L1 in front of a Redis L2, via BentoCache.
 *
 * Point reads/writes to Redis are wrapped in an Effect with a timeout and a
 * bounded retry, so a momentarily slow Redis degrades gracefully instead of
 * hanging a request. `getOrSet` relies on BentoCache's own stampede
 * protection.
 */
class BentoCacheDriver implements ICacheDriver {
  private readonly bento: BentoCache<Record<string, never>>;
  private readonly redis: Redis;

  /**
   * @param {CacheConfig} config - Redis URL and optional L1 size.
   */
  constructor(config: CacheConfig) {
    this.redis = new Redis(config.redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });
    this.bento = new BentoCache({
      default: "multitier",
      stores: {
        multitier: bentostore()
          .useL1Layer(
            memoryDriver({
              maxItems: config.l1MaxItems ?? DEFAULT_L1_MAX_ITEMS,
            }),
          )
          .useL2Layer(redisDriver({ connection: this.redis })),
      },
    });
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
  private run<A>(
    op: string,
    thunk: () => Promise<A>,
  ): Effect.Effect<A, CacheError> {
    return Effect.tryPromise({
      catch: (error: unknown): CacheError =>
        new CacheError({
          message: `${CacheMessage.opFailed}: ${op}: ${String(error)}`,
          status: HttpStatus.internal,
        }),
      try: thunk,
    }).pipe(
      Effect.timeout(OP_TIMEOUT),
      Effect.retry(OP_RETRIES),
      Effect.catchAll((error: unknown): Effect.Effect<A, CacheError> => {
        if (error instanceof CacheError) {
          return Effect.fail(error);
        }

        return Effect.fail(
          new CacheError({
            message: `${CacheMessage.opFailed}: ${op}`,
            status: HttpStatus.internal,
          }),
        );
      }),
    );
  }

  /**
   * Reads a cached value, or computes+stores it via `factory` on a miss.
   *
   * The `factory` is an Effect; BentoCache's stampede protection ensures it
   * runs at most once per concurrent miss.
   *
   * @param {string} key - The cache key.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   * @param {() => Effect.Effect<A, CacheError>} factory - Computes the value.
   *
   * @returns {Effect.Effect<A, CacheError>} The cached or computed value.
   */
  getOrSet<A>(
    key: string,
    ttlSeconds: number,
    factory: () => Effect.Effect<A, CacheError>,
  ): Effect.Effect<A, CacheError> {
    return this.run(CacheOp.getOrSet, (): Promise<A> =>
      this.bento.getOrSet<A>({
        factory: () => Effect.runPromise(factory()),
        key,
        ttl: `${ttlSeconds}s`,
      }),
    );
  }

  /**
   * Stores a value with a TTL.
   *
   * @param {string} key - The cache key.
   * @param {A} value - The value to store.
   * @param {number} ttlSeconds - Time-to-live in seconds.
   *
   * @returns {Effect.Effect<void, CacheError>} Void on success, or a cache
   *   error.
   */
  set<A>(
    key: string,
    value: A,
    ttlSeconds: number,
  ): Effect.Effect<void, CacheError> {
    return this.run(CacheOp.set, async (): Promise<void> => {
      await this.bento.set({ key, ttl: `${ttlSeconds}s`, value });
    });
  }

  /**
   * Reads a value; `Option.none()` if absent.
   *
   * @param {string} key - The cache key.
   *
   * @returns {Effect.Effect<Option.Option<A>, CacheError>} The cached value or
   *   none.
   */
  get<A>(key: string): Effect.Effect<Option.Option<A>, CacheError> {
    return this.run(CacheOp.get, (): Promise<A | undefined> =>
      this.bento.get<A | undefined>({ defaultValue: undefined, key }),
    ).pipe(
      Effect.map((value: A | undefined): Option.Option<A> => {
        if (is.undefined(value)) {
          return Option.none();
        }
        return Option.some(value);
      }),
    );
  }

  /**
   * Removes a value.
   *
   * @param {string} key - The cache key.
   *
   * @returns {Effect.Effect<void, CacheError>} Void on success, or a cache
   *   error.
   */
  delete(key: string): Effect.Effect<void, CacheError> {
    return this.run(CacheOp.delete, async (): Promise<void> => {
      await this.bento.delete({ key });
    });
  }
}

export { BentoCacheDriver };
