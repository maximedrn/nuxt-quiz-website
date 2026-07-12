import is from '@sindresorhus/is'
import { Effect } from 'effect'
import type { IDatabaseService } from '@/server/lib/database/database.interface'
import { DatabaseMessage } from '@/server/lib/database/database.message'
import { DatabaseService } from '@/server/lib/database/database.service'
import { type DatabaseConfig, DatabaseError } from '@/server/lib/database/database.types'
import { DrizzleDatabaseDriver } from '@/server/lib/database/drivers/database.drizzle.driver'
import { HttpStatus } from '@/server/lib/http/http.status'

/**
 * Builds the database service (single shared connection pool).
 *
 * The single entry point for database construction; both storage and auth take
 * their Drizzle client from here. Validates the URL before opening a connection.
 *
 * @param {DatabaseConfig} config - Connection string.
 *
 * @returns {Effect.Effect<IDatabaseService, DatabaseError>} The service, or a config error.
 *
 * @example
 * ```ts
 * const service = Effect.runSync(
 *   createDatabase({ url: useEnv().config.databaseUrl }).pipe(
 *     Effect.catchAll((err) => Effect.die(createError({ statusCode: err.status, statusMessage: err.message }))),
 *   ),
 * )
 * ```
 */
export function createDatabase(
  config: DatabaseConfig,
): Effect.Effect<IDatabaseService, DatabaseError> {
  if (!is.nonEmptyString(config.url)) {
    return Effect.fail(
      new DatabaseError({
        message: DatabaseMessage.URL_MISSING,
        status: HttpStatus.INTERNAL,
      }),
    )
  }
  return Effect.succeed(new DatabaseService(new DrizzleDatabaseDriver(config.url)))
}
