import { createAuth } from '@/server/lib/auth/auth.factory'
import type { IAuthService } from '@/server/lib/auth/auth.interface'
import { useDatabase } from '@/server/lib/database/database.context'
import { useEnv } from '@/server/lib/env/env.context'

let _auth: IAuthService | undefined

/**
 * Lazily-built, process-wide auth credential service.
 *
 * Wires the shared database client and the dedicated lookup pepper from the
 * validated environment.
 *
 * @returns {IAuthService} The auth service.
 */
export function useAuth(): IAuthService {
  if (!_auth) {
    _auth = createAuth({
      db: useDatabase().db,
      config: { lookupPepper: useEnv().config.authLookupPepper },
    })
  }
  return _auth
}
