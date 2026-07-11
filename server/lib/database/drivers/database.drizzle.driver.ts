import { Effect } from 'effect'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { DatabasePool } from '@/server/lib/database/database.constants'
import { DatabaseMessage } from '@/server/lib/database/database.message'
import { databaseSchema } from '@/server/lib/database/database.schema'
import { DatabaseError, type Database } from '@/server/lib/database/database.types'
import { HttpStatus } from '@/server/lib/http/http.status'
import type { IDatabaseDriver } from '@/server/lib/database/drivers/database.driver.interface'

/**
 * Drizzle-over-postgres.js database driver. Owns a single connection pool for
 * the whole process.
 */
export class DrizzleDatabaseDriver implements IDatabaseDriver {
  private readonly client: postgres.Sql
  readonly db: Database

  /**
   * @param {string} url - PostgreSQL connection string.
   */
  constructor(url: string) {
    this.client = postgres(url, { prepare: DatabasePool.PREPARE })
    this.db = drizzle(this.client, { schema: databaseSchema })
  }

  /**
   * Closes the underlying postgres.js connection pool.
   *
   * @returns {Effect.Effect<void, DatabaseError>} Success or a tagged error with the disconnect failure.
   */
  disconnect(): Effect.Effect<void, DatabaseError> {
    return Effect.tryPromise({
      try: (): Promise<void> => this.client.end(),
      catch: (error): DatabaseError =>
        new DatabaseError({
          message: `${DatabaseMessage.DISCONNECT_FAILED}: ${error instanceof Error ? error.message : String(error)}`,
          status: HttpStatus.INTERNAL,
        }),
    })
  }
}
