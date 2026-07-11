import { errAsync, okAsync, type ResultAsync } from 'neverthrow'
import { isNone, unwrapSome } from 'option-t/plain_option'
import { BaseAuthService } from '@/server/lib/auth/auth.base'
import { AuthError } from '@/server/lib/auth/auth.error'
import {
  type AuthDependencies,
  type AuthSession,
  codeSchema,
  type TokenPair,
} from '@/server/lib/auth/auth.types'

/**
 * Concrete auth service.
 *
 * Registration and login both hinge on a peppered HMAC lookup of the 8-digit
 * code (so accounts are found without storing the code), with an argon2 hash as
 * the actual verifier. Refresh tokens are single-use and rotate on every use.
 */
class AuthService extends BaseAuthService {
  /**
   * @param {AuthDependencies} deps - Database, cache and static config.
   */
  constructor(deps: AuthDependencies) {
    super(deps)
  }

  register(code: string): ResultAsync<AuthSession, string> {
    const parsed = codeSchema.safeParse(code)
    if (!parsed.success) {
      return errAsync(parsed.error.issues[0]?.message ?? AuthError.INVALID_CREDENTIALS)
    }
    const lookupKey = this.lookup(code)
    return this.findByLookup(lookupKey).andThen((existing) => {
      if (!isNone(existing)) return errAsync(AuthError.CODE_TAKEN)
      return this.hashCode(code)
        .andThen((codeHash) => this.insertUser(lookupKey, codeHash))
        .andThen((userId) => this.issueTokens(userId).map((tokens) => ({ userId, tokens })))
    })
  }

  login(code: string): ResultAsync<AuthSession, string> {
    const parsed = codeSchema.safeParse(code)
    if (!parsed.success) return errAsync(AuthError.INVALID_CREDENTIALS)
    const lookupKey = this.lookup(code)
    return this.findByLookup(lookupKey).andThen((maybeUser) => {
      if (isNone(maybeUser)) return errAsync(AuthError.INVALID_CREDENTIALS)
      const user = unwrapSome(maybeUser)
      return this.verifyCode(user.codeHash, code).andThen((valid) => {
        if (!valid) return errAsync(AuthError.INVALID_CREDENTIALS)
        return this.issueTokens(user.id).map((tokens) => ({ userId: user.id, tokens }))
      })
    })
  }

  verifyAccess(token: string): ResultAsync<{ userId: number }, string> {
    return this.verifyAccessToken(token)
  }

  refresh(refreshToken: string): ResultAsync<TokenPair, string> {
    return this.consumeRefresh(refreshToken).andThen((userId) => this.issueTokens(userId))
  }

  logout(refreshToken: string): ResultAsync<void, string> {
    // Deleting an absent token is a no-op success — logout is idempotent.
    return this.consumeRefresh(refreshToken)
      .map(() => undefined)
      .orElse(() => okAsync(undefined))
  }
}

export { AuthService }
