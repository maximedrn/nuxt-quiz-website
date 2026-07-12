import { Effect, Option } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'
import { CacheService } from '@/server/lib/cache/cache.service'
import { CacheError } from '@/server/lib/cache/cache.types'
import type { ICacheDriver } from '@/server/lib/cache/drivers/cache.driver.interface'
import { HttpStatus } from '@/server/lib/http/http.status'

// Stub driver backed by a plain Map — no I/O, returns Effects.
class StubDriver implements ICacheDriver {
  readonly store = new Map<string, unknown>()

  getOrSet<A>(
    key: string,
    _ttl: number,
    factory: () => Effect.Effect<A, CacheError>,
  ): Effect.Effect<A, CacheError> {
    if (this.store.has(key)) {
      return Effect.succeed(this.store.get(key) as A)
    }
    return factory().pipe(
      Effect.tap((v) =>
        Effect.sync(() => {
          this.store.set(key, v)
        }),
      ),
    )
  }

  set<A>(key: string, value: A, _ttl: number): Effect.Effect<void, CacheError> {
    return Effect.sync(() => {
      this.store.set(key, value)
    })
  }

  get<A>(key: string): Effect.Effect<Option.Option<A>, CacheError> {
    return Effect.succeed(
      this.store.has(key) ? Option.some(this.store.get(key) as A) : Option.none(),
    )
  }

  delete(key: string): Effect.Effect<void, CacheError> {
    return Effect.sync(() => {
      this.store.delete(key)
    })
  }
}

describe('CacheService.', () => {
  let driver: StubDriver
  let service: CacheService

  beforeEach(() => {
    driver = new StubDriver()
    service = new CacheService(driver)
  })

  /**
   * Verifies that `getOrSet` calls the factory exactly once on the first miss
   * and returns the cached value on subsequent calls — the core stampede-protection
   * contract.
   */
  it('Calls factory once and serves the cached value on subsequent hits.', async () => {
    let calls = 0
    const factory = () =>
      Effect.sync(() => {
        calls++
        return 42
      })

    const first = await Effect.runPromise(service.getOrSet('k', 60, factory))
    const second = await Effect.runPromise(service.getOrSet('k', 60, factory))

    expect(first).toBe(42)
    expect(second).toBe(42)
    expect(calls).toBe(1)
  })

  /**
   * Verifies that `delete` removes the key so a subsequent `get` returns
   * `Option.none()` — the eviction contract callers depend on.
   */
  it('Returns Option.none() after a key is deleted.', async () => {
    await Effect.runPromise(service.set('x', 'hello', 60))
    await Effect.runPromise(service.delete('x'))

    const result = await Effect.runPromise(service.get<string>('x'))
    expect(Option.isNone(result)).toBe(true)
  })

  /**
   * Verifies that `get` returns `Option.some` for a key that exists — confirming
   * the Option wrapping is applied correctly by the service layer.
   */
  it('Returns Option.some with the stored value for an existing key.', async () => {
    await Effect.runPromise(service.set('y', 99, 60))

    const result = await Effect.runPromise(service.get<number>('y'))
    expect(Option.isSome(result)).toBe(true)
    expect(Option.getOrNull(result)).toBe(99)
  })

  /**
   * Verifies that `CacheError` is a properly tagged error with the correct
   * status field — required by error-boundary middleware that inspects `.status`.
   */
  it('CacheError carries the expected tag and status.', () => {
    const e = new CacheError({ message: 'test', status: HttpStatus.INTERNAL })
    expect(e._tag).toBe('CacheError')
    expect(e.status).toBe(HttpStatus.INTERNAL)
  })
})
