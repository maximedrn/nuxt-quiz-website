import type { ResultAsync } from 'neverthrow'
import { z } from 'zod'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import type { Database } from '@/server/lib/database/database.types'

/** Zod schema for a login/registration code: exactly 8 digits. */
const codeSchema = z.string().regex(/^\d{8}$/, 'Code must be exactly 8 digits.')

/** An issued access + refresh pair. */
interface TokenPair {
  readonly accessToken: string
  readonly refreshToken: string
  /** Access token lifetime in seconds (for the client to schedule refresh). */
  readonly accessExpiresIn: number
}

/** Result of a successful register/login. */
interface AuthSession {
  readonly userId: number
  readonly tokens: TokenPair
}

/** Static configuration for the auth service. */
interface AuthConfig {
  readonly accessSecret: string
  readonly refreshSecret: string
  /** Pepper for the deterministic code lookup HMAC. */
  readonly lookupPepper: string
  readonly accessTtlSeconds: number
  readonly refreshTtlSeconds: number
}

/** Collaborators the auth service depends on. */
interface AuthDependencies {
  readonly db: Database
  readonly cache: ICacheService
  readonly config: AuthConfig
}

/** Auth operations. Every method is fallible and returns a `ResultAsync`. */
interface AuthOperations {
  register(code: string): ResultAsync<AuthSession, string>
  login(code: string): ResultAsync<AuthSession, string>
  verifyAccess(token: string): ResultAsync<{ userId: number }, string>
  refresh(refreshToken: string): ResultAsync<TokenPair, string>
  logout(refreshToken: string): ResultAsync<void, string>
}

export type { AuthConfig, AuthDependencies, AuthOperations, AuthSession, TokenPair }
export { codeSchema }
