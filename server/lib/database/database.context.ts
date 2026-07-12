import { Effect } from 'effect'
import { createDatabase } from '@/server/lib/database/database.factory'
import type { IDatabaseService } from '@/server/lib/database/database.interface'
import { useEnv } from '@/server/lib/env/env.context'

let _database: IDatabaseService | undefined

/**
 * Lazily-built, process-wide database service (one shared connection pool).
 *
 * Validates the DATABASE_URL from the env service on first use and memoizes
 * the result. Any failure is a fatal boot condition — it dies with a H3
 * createError so Nitro surfaces a readable 500.
 *
 * @returns {IDatabaseService} The database service.
 */
export function useDatabase(): IDatabaseService {
  if (!_database) {
    _database = Effect.runSync(
      createDatabase({ url: useEnv().config.databaseUrl }).pipe(
        Effect.catchAll((error) =>
          Effect.die(createError({ statusCode: error.status, statusMessage: error.message })),
        ),
      ),
    )
  }
  return _database
}
