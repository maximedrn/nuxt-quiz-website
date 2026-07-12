import { Data } from 'effect'
import type { Effect } from 'effect'
import type { Database } from '@/server/lib/database/database.types'
import { HttpStatus } from '@/server/lib/http/http.status'

/** Tagged error for auth domain failures. */
export class AuthError extends Data.TaggedError('AuthError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

/** Static configuration for the auth service. */
export interface AuthConfig {
  readonly lookupPepper: string
}

/** Collaborators the auth service depends on. */
export interface AuthDependencies {
  readonly db: Database
  readonly config: AuthConfig
}

/** Auth operations — every method returns an `Effect`. */
export interface AuthOperations {
  register(code: string): Effect.Effect<{ id: number }, AuthError>
  login(code: string): Effect.Effect<{ id: number }, AuthError>
}
