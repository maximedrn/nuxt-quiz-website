import { Effect } from "effect";
import { createDatabase } from "@/app/lib/database/database.factory.ts";
import type { IDatabaseService } from "@/app/lib/database/database.interface.ts";
import type { DatabaseError } from "@/app/lib/database/database.types.ts";
import { useEnv } from "@/app/lib/env/env.context.ts";

let _database: IDatabaseService | undefined;

/**
 * Lazily-built, process-wide database service (one shared connection pool).
 *
 * @returns {IDatabaseService} The database service.
 */
const useDatabase: () => IDatabaseService = (): IDatabaseService => {
  if (!_database) {
    const { config } = useEnv();
    _database = Effect.runSync(
      createDatabase({
        host: config.databaseHost,
        name: config.databaseName,
        password: config.databasePassword,
        port: config.databasePort,
        user: config.databaseUser,
      }).pipe(
        Effect.catchAll((error: DatabaseError): Effect.Effect<never, never> =>
          Effect.die(
            createError({
              statusCode: error.status,
              statusMessage: error.message,
            }),
          ),
        ),
      ),
    );
  }
  return _database;
};

export { useDatabase };
