import { createHmac } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { AuthRules } from '@/server/lib/auth/auth.constants'
import type { IAuthService } from '@/server/lib/auth/auth.interface'
import { AuthMessage } from '@/server/lib/auth/auth.message'
import { type AuthConfig, type AuthDependencies, AuthError } from '@/server/lib/auth/auth.types'
import type { Database } from '@/server/lib/database/database.types'
import { users } from '@/server/lib/database/schema/user.schema'
import { HttpStatus } from '@/server/lib/http/http.status'

/**
 * Pure, testable HMAC lookup computation.
 *
 * Extracted so unit tests can verify determinism and pepper-dependency without
 * requiring a database or Nuxt globals.
 *
 * @param {string} code - The 8-digit user code.
 * @param {string} pepper - The server-side pepper secret.
 *
 * @returns {string} The hex-encoded HMAC digest used as the account lookup key.
 *
 * @example
 * ```ts
 * const key = computeLookup('12345678', process.env.AUTH_LOOKUP_PEPPER)
 * ```
 */
function computeLookup(code: string, pepper: string): string {
  return createHmac(AuthRules.LOOKUP_ALGORITHM, pepper).update(code).digest('hex')
}

/**
 * Concrete auth service backed by `nuxt-auth-utils` scrypt hashing.
 *
 * Security invariants:
 * - `register`: always calls `hashPassword` before checking for a collision, so
 *   timing cannot reveal whether an account exists.
 * - `login` miss: runs a throwaway `hashPassword` to equalize timing with the
 *   hit path, preventing enumeration via response latency.
 * - Lookup key is a peppered HMAC — the code never appears in the database.
 */
class AuthService implements IAuthService {
  readonly #db: Database
  readonly #config: AuthConfig

  /**
   * @param {AuthDependencies} deps - Database client and static configuration.
   */
  constructor(deps: AuthDependencies) {
    this.#db = deps.db
    this.#config = deps.config
  }

  /** Deterministic, peppered HMAC of a code — the account lookup key. */
  private lookup(code: string): string {
    return computeLookup(code, this.#config.lookupPepper)
  }

  /**
   * Registers a new account for the given 8-digit code.
   *
   * Always hashes first (constant-time, no enumeration timing oracle), then
   * checks for a collision. Returns the new user `id` on success.
   *
   * @param {string} code - The 8-digit registration code.
   *
   * @returns {Effect.Effect<{ id: number }, AuthError>}
   *
   * @example
   * ```ts
   * const result = await Effect.runPromise(auth.register('12345678'))
   * ```
   */
  register(code: string): Effect.Effect<{ id: number }, AuthError> {
    return Effect.gen(this, function* () {
      // Hash first — constant-time regardless of whether the code is taken.
      const codeHash = yield* Effect.tryPromise({
        try: () => hashPassword(code),
        catch: (err) => new AuthError({ message: String(err), status: HttpStatus.INTERNAL }),
      })

      const codeLookup = this.lookup(code)

      const existing = yield* Effect.tryPromise({
        try: () =>
          this.#db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.codeLookup, codeLookup))
            .limit(1),
        catch: (err) => new AuthError({ message: String(err), status: HttpStatus.INTERNAL }),
      })

      if (existing[0]) {
        return yield* Effect.fail(
          new AuthError({ message: AuthMessage.CODE_TAKEN, status: HttpStatus.CONFLICT }),
        )
      }

      const inserted = yield* Effect.tryPromise({
        try: () =>
          this.#db.insert(users).values({ codeLookup, codeHash }).returning({ id: users.id }),
        catch: (err) => new AuthError({ message: String(err), status: HttpStatus.INTERNAL }),
      })

      const row = inserted[0]
      if (!row) {
        return yield* Effect.fail(
          new AuthError({ message: 'Insert returned no row.', status: HttpStatus.INTERNAL }),
        )
      }

      return { id: row.id }
    })
  }

  /**
   * Authenticates an account by its 8-digit code.
   *
   * On a lookup miss, runs a throwaway `hashPassword` to equalize timing with
   * the hit path, then fails. On a hit, verifies the stored scrypt hash.
   *
   * @param {string} code - The 8-digit login code.
   *
   * @returns {Effect.Effect<{ id: number }, AuthError>}
   *
   * @example
   * ```ts
   * const result = await Effect.runPromise(auth.login('12345678'))
   * ```
   */
  login(code: string): Effect.Effect<{ id: number }, AuthError> {
    return Effect.gen(this, function* () {
      const codeLookup = this.lookup(code)

      const rows = yield* Effect.tryPromise({
        try: () =>
          this.#db
            .select({ id: users.id, codeHash: users.codeHash })
            .from(users)
            .where(eq(users.codeLookup, codeLookup))
            .limit(1),
        catch: (err) => new AuthError({ message: String(err), status: HttpStatus.INTERNAL }),
      })

      const user = rows[0]

      if (!user) {
        // Equalize timing: a miss must cost roughly the same as a hit.
        yield* Effect.tryPromise({
          try: () => hashPassword(code),
          catch: () => new AuthError({ message: '', status: HttpStatus.INTERNAL }),
        })
        return yield* Effect.fail(
          new AuthError({
            message: AuthMessage.INVALID_CREDENTIALS,
            status: HttpStatus.UNAUTHORIZED,
          }),
        )
      }

      const valid = yield* Effect.tryPromise({
        try: () => verifyPassword(user.codeHash, code),
        catch: (err) => new AuthError({ message: String(err), status: HttpStatus.INTERNAL }),
      })

      if (!valid) {
        return yield* Effect.fail(
          new AuthError({
            message: AuthMessage.INVALID_CREDENTIALS,
            status: HttpStatus.UNAUTHORIZED,
          }),
        )
      }

      return { id: user.id }
    })
  }
}

export { AuthService, computeLookup }
