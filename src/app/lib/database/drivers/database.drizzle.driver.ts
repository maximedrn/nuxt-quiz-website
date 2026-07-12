import { drizzle } from "drizzle-orm/postgres-js";
import { Effect } from "effect";
import postgres from "postgres";
import { DatabasePool } from "@/app/lib/database/database.constants.ts";
import { DatabaseMessage } from "@/app/lib/database/database.message.ts";
import { databaseSchema } from "@/app/lib/database/database.schema.ts";
import {
  type Database,
  type DatabaseConfig,
  DatabaseError,
} from "@/app/lib/database/database.types.ts";
import type { IDatabaseDriver } from "@/app/lib/database/drivers/database.driver.interface.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Drizzle-over-postgres.js database driver. Owns a single connection pool for
 * the whole process.
 */
class DrizzleDatabaseDriver implements IDatabaseDriver {
  private readonly client: postgres.Sql;
  readonly db: Database;

  /**
   * @param {DatabaseConfig} config - PostgreSQL connection parameters.
   */
  constructor(config: DatabaseConfig) {
    this.client = postgres({
      database: config.name,
      host: config.host,
      password: config.password,
      port: config.port,
      prepare: DatabasePool.prepare,
      user: config.user,
    });
    this.db = drizzle(this.client, { schema: databaseSchema });
  }

  /**
   * Closes the underlying postgres.js connection pool.
   *
   * @returns {Effect.Effect<void, DatabaseError>} Success or a tagged error
   *   with the disconnect failure.
   */
  disconnect(): Effect.Effect<void, DatabaseError> {
    return Effect.tryPromise({
      catch: (error: unknown): DatabaseError => {
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }

        return new DatabaseError({
          message: `${DatabaseMessage.DISCONNECT_FAILED}: ${errorMessage}`,
          status: HttpStatus.internal,
        });
      },
      try: (): Promise<void> => this.client.end(),
    });
  }
}

export { DrizzleDatabaseDriver };
