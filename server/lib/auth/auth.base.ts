import { createHmac, randomBytes } from 'node:crypto'
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2'
import { eq } from 'drizzle-orm'
import { jwtVerify, SignJWT } from 'jose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { createNone, createSome, isNone, type Option, unwrapSome } from 'option-t/plain_option'
import { AuthRules } from '@/server/lib/auth/auth.constants'
import { AuthError } from '@/server/lib/auth/auth.error'
import type { IAuthService } from '@/server/lib/auth/auth.interface'
import type {
  AuthConfig,
  AuthDependencies,
  AuthSession,
  TokenPair,
} from '@/server/lib/auth/auth.types'
import { CacheKey } from '@/server/lib/cache/cache.constants'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import type { Database } from '@/server/lib/database/database.types'
import { users } from '@/server/lib/database/schema/user.schema'

/** A user row as needed for credential verification. */
interface UserRecord {
  readonly id: number
  readonly codeHash: string
}

/**
 * Shared auth machinery: credential hashing, deterministic lookup, JWT signing
 * and refresh-token rotation. Concrete services build their flows from these
 * protected helpers. All helpers stay inside the neverthrow flow.
 */
abstract class BaseAuthService implements IAuthService {
  protected readonly db: Database
  protected readonly cache: ICacheService
  protected readonly config: AuthConfig

  /**
   * @param {AuthDependencies} deps - Database, cache and static config.
   */
  protected constructor(deps: AuthDependencies) {
    this.db = deps.db
    this.cache = deps.cache
    this.config = deps.config
  }

  abstract register(code: string): ResultAsync<AuthSession, string>
  abstract login(code: string): ResultAsync<AuthSession, string>
  abstract verifyAccess(token: string): ResultAsync<{ userId: number }, string>
  abstract refresh(refreshToken: string): ResultAsync<TokenPair, string>
  abstract logout(refreshToken: string): ResultAsync<void, string>

  /** Deterministic, peppered HMAC of a code — the account lookup key. */
  protected lookup(code: string): string {
    return createHmac(AuthRules.LOOKUP_ALGORITHM, this.config.lookupPepper)
      .update(code)
      .digest('hex')
  }

  /** Argon2-hashes a code. */
  protected hashCode(code: string): ResultAsync<string, string> {
    return ResultAsync.fromPromise(argonHash(code), (err) =>
      AuthError.OP_FAILED('hashCode', err instanceof Error ? err.message : String(err)),
    )
  }

  /** Verifies a code against its argon2 hash. */
  protected verifyCode(hash: string, code: string): ResultAsync<boolean, string> {
    return ResultAsync.fromPromise(argonVerify(hash, code), (err) =>
      AuthError.OP_FAILED('verifyCode', err instanceof Error ? err.message : String(err)),
    )
  }

  /** Finds a user by their code-lookup key. */
  protected findByLookup(lookupKey: string): ResultAsync<Option<UserRecord>, string> {
    return ResultAsync.fromPromise(
      this.db
        .select({ id: users.id, codeHash: users.codeHash })
        .from(users)
        .where(eq(users.codeLookup, lookupKey))
        .limit(1),
      (err) =>
        AuthError.OP_FAILED('findByLookup', err instanceof Error ? err.message : String(err)),
    ).map((rows) => (rows[0] ? createSome(rows[0]) : createNone()))
  }

  /** Inserts a new user, returning its id. */
  protected insertUser(lookupKey: string, codeHash: string): ResultAsync<number, string> {
    return ResultAsync.fromPromise(
      this.db.insert(users).values({ codeLookup: lookupKey, codeHash }).returning({ id: users.id }),
      (err) => AuthError.OP_FAILED('insertUser', err instanceof Error ? err.message : String(err)),
    ).andThen((rows) =>
      rows[0]
        ? okAsync(rows[0].id)
        : errAsync(AuthError.OP_FAILED('insertUser', 'no row returned')),
    )
  }

  /** Signs a short-lived access JWT for a user. */
  protected signAccess(userId: number): ResultAsync<string, string> {
    const secret = new TextEncoder().encode(this.config.accessSecret)
    const promise = new SignJWT({})
      .setProtectedHeader({ alg: AuthRules.JWT_ALGORITHM })
      .setSubject(String(userId))
      .setIssuedAt()
      .setExpirationTime(`${this.config.accessTtlSeconds}s`)
      .sign(secret)
    return ResultAsync.fromPromise(promise, (err) =>
      AuthError.OP_FAILED('signAccess', err instanceof Error ? err.message : String(err)),
    )
  }

  /** Verifies an access JWT and extracts the user id. */
  protected verifyAccessToken(token: string): ResultAsync<{ userId: number }, string> {
    const secret = new TextEncoder().encode(this.config.accessSecret)
    return ResultAsync.fromPromise(
      jwtVerify(token, secret),
      () => AuthError.INVALID_ACCESS,
    ).andThen(({ payload }) => {
      const userId = Number(payload.sub)
      return Number.isInteger(userId) ? okAsync({ userId }) : errAsync(AuthError.INVALID_ACCESS)
    })
  }

  /** Issues a fresh access + refresh pair, persisting the refresh token. */
  protected issueTokens(userId: number): ResultAsync<TokenPair, string> {
    return this.signAccess(userId).andThen((accessToken) => {
      const refreshToken = randomBytes(AuthRules.REFRESH_TOKEN_BYTES).toString('hex')
      return this.cache
        .set(CacheKey.refreshToken(refreshToken), userId, this.config.refreshTtlSeconds)
        .map(() => ({ accessToken, refreshToken, accessExpiresIn: this.config.accessTtlSeconds }))
    })
  }

  /**
   * Validates a refresh token and consumes it (single-use rotation): the token
   * is deleted, so a replayed refresh token is rejected.
   */
  protected consumeRefresh(refreshToken: string): ResultAsync<number, string> {
    const key = CacheKey.refreshToken(refreshToken)
    return this.cache.get<number>(key).andThen((maybeUserId) => {
      if (isNone(maybeUserId)) return errAsync(AuthError.INVALID_REFRESH)
      const userId = unwrapSome(maybeUserId)
      return this.cache.delete(key).map(() => userId)
    })
  }
}

export type { UserRecord }
export { BaseAuthService }
