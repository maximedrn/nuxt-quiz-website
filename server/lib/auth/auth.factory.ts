import type { IAuthService } from '@/server/lib/auth/auth.interface'
import { AuthService } from '@/server/lib/auth/auth.service'
import type { AuthDependencies } from '@/server/lib/auth/auth.types'

/**
 * Builds the auth credential service.
 *
 * The single entry point for auth construction. Construction can't fail, so it
 * returns the service directly (no Effect).
 *
 * @param {AuthDependencies} deps - Shared database client + static config.
 *
 * @returns {IAuthService} The credential service.
 *
 * @example
 * ```ts
 * const auth = createAuth({ db: useDatabase().db, config: { lookupPepper } })
 * ```
 */
export function createAuth(deps: AuthDependencies): IAuthService {
  return new AuthService(deps)
}
