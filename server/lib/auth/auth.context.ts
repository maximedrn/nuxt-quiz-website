import { createAuth } from '@/server/lib/auth/auth.factory'
import type { IAuthService } from '@/server/lib/auth/auth.interface'
import { useCache } from '@/server/lib/cache/cache.context'
import { useDatabase } from '@/server/lib/database/database.context'
import { useEnv } from '@/server/lib/env/env.context'

let _auth: IAuthService | undefined

/**
 * Lazily-built, process-wide auth service.
 *
 * @returns {IAuthService} The auth service.
 */
export function useAuth(): IAuthService {
  if (!_auth) {
    const result = createAuth(useEnv().config, useCache(), useDatabase().db)
    if (result.isErr()) {
      throw createError({ statusCode: 500, statusMessage: result.error })
    }
    _auth = result.value
  }
  return _auth
}
