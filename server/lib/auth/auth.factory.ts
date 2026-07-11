import { ok, type Result } from 'neverthrow'
import type { IAuthService } from '@/server/lib/auth/auth.interface'
import { AuthService } from '@/server/lib/auth/auth.service'
import type { ICacheService } from '@/server/lib/cache/cache.interface'
import type { Database } from '@/server/lib/database/database.types'
import type { EnvConfig } from '@/server/lib/env/env.types'

/**
 * Builds the auth service.
 *
 * The single entry point for auth construction. Users always live in Postgres
 * (independent of `STORAGE_DRIVER`) via the shared database; refresh tokens
 * live in the shared cache.
 *
 * @param {EnvConfig} env - Validated environment configuration.
 * @param {ICacheService} cache - Shared cache (refresh-token store).
 * @param {Database} db - Shared Drizzle client (`users` table).
 *
 * @returns {Result<IAuthService, string>} The service.
 *
 * @example
 * ```ts
 * const result = createAuth(useEnv().config, useCache(), useDatabase().db)
 * if (result.isErr()) throw createError({ statusCode: 500, statusMessage: result.error })
 * ```
 */
export function createAuth(
  env: EnvConfig,
  cache: ICacheService,
  db: Database,
): Result<IAuthService, string> {
  return ok(
    new AuthService({
      db,
      cache,
      config: {
        accessSecret: env.jwtAccessSecret,
        refreshSecret: env.jwtRefreshSecret,
        lookupPepper: env.jwtAccessSecret,
        accessTtlSeconds: env.accessTokenTtl,
        refreshTtlSeconds: env.refreshTokenTtl,
      },
    }),
  )
}
