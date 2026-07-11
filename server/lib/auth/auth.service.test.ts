import { okAsync, ResultAsync } from 'neverthrow'
import { createNone, createSome, type Option } from 'option-t/plain_option'
import { describe, expect, it } from 'vitest'
import { AuthError } from '@/server/lib/auth/auth.error'
import { AuthService } from '@/server/lib/auth/auth.service'
import { codeSchema } from '@/server/lib/auth/auth.types'
import { CacheKey } from '@/server/lib/cache/cache.constants'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import type { Database } from '@/server/lib/database/database.types'

/** In-memory cache stub implementing the full ICacheService contract. */
class StubCache implements ICacheService {
  readonly store = new Map<string, unknown>()

  getOrSet<T>(key: string, _ttl: number, factory: () => Promise<T>): ResultAsync<T, string> {
    if (this.store.has(key)) return okAsync(this.store.get(key) as T)
    return ResultAsync.fromSafePromise(
      factory().then((value) => {
        this.store.set(key, value)
        return value
      }),
    )
  }

  set<T>(key: string, value: T, _ttlSeconds?: number): ResultAsync<void, string> {
    this.store.set(key, value)
    return okAsync(undefined)
  }

  get<T>(key: string): ResultAsync<Option<T>, string> {
    return okAsync(this.store.has(key) ? createSome(this.store.get(key) as T) : createNone())
  }

  delete(key: string): ResultAsync<void, string> {
    this.store.delete(key)
    return okAsync(undefined)
  }
}

function makeService(cache: ICacheService): AuthService {
  return new AuthService({
    db: {} as Database,
    cache,
    config: {
      accessSecret: 'test-access-secret-abcdefgh',
      refreshSecret: 'test-refresh-secret-abcdefgh',
      lookupPepper: 'test-pepper',
      accessTtlSeconds: 900,
      refreshTtlSeconds: 3600,
    },
  })
}

describe('codeSchema', () => {
  /** Only exactly-8-digit codes are accepted; length and charset are enforced. */
  it('Accepts 8 digits and rejects anything else.', () => {
    expect(codeSchema.safeParse('12345678').success).toBe(true)
    expect(codeSchema.safeParse('1234567').success).toBe(false)
    expect(codeSchema.safeParse('1234567a').success).toBe(false)
  })
})

describe('AuthService refresh rotation', () => {
  /**
   * A refresh token is single-use: after refreshing, the original token must be
   * rejected. This is the core defense against refresh-token replay.
   */
  it('Consumes the old refresh token on rotation.', async () => {
    const cache = new StubCache()
    const service = makeService(cache)
    await cache.set(CacheKey.refreshToken('original'), 1, 3600)

    const rotated = await service.refresh('original')
    expect(rotated.isOk()).toBe(true)
    if (rotated.isErr()) return
    expect(rotated.value.refreshToken).not.toBe('original')

    const replay = await service.refresh('original')
    expect(replay.isErr()).toBe(true)
    if (replay.isErr()) expect(replay.error).toBe(AuthError.INVALID_REFRESH)
  })

  /**
   * The access token minted during refresh must verify back to the same user —
   * the round-trip that the auth middleware relies on.
   */
  it('Issues an access token that verifies to the user.', async () => {
    const cache = new StubCache()
    const service = makeService(cache)
    await cache.set(CacheKey.refreshToken('tok'), 42, 3600)

    const rotated = await service.refresh('tok')
    if (rotated.isErr()) throw new Error('expected ok')
    const verified = await service.verifyAccess(rotated.value.accessToken)
    expect(verified.isOk()).toBe(true)
    if (verified.isOk()) expect(verified.value.userId).toBe(42)
  })

  /**
   * Logout revokes the refresh token so it can't be rotated afterwards.
   */
  it('Revokes the refresh token on logout.', async () => {
    const cache = new StubCache()
    const service = makeService(cache)
    await cache.set(CacheKey.refreshToken('bye'), 7, 3600)

    await service.logout('bye')
    const afterLogout = await service.refresh('bye')
    expect(afterLogout.isErr()).toBe(true)
  })
})
