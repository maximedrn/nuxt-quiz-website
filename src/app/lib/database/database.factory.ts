import is from "@sindresorhus/is";
import { Effect } from "effect";
import type { IDatabaseService } from "@/app/lib/database/database.interface.ts";
import { DatabaseMessage } from "@/app/lib/database/database.message.ts";
import { DatabaseService } from "@/app/lib/database/database.service.ts";
import {
  type DatabaseConfig,
  DatabaseError,
} from "@/app/lib/database/database.types.ts";
import { DrizzleDatabaseDriver } from "@/app/lib/database/drivers/database.drizzle.driver.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Builds the database service (single shared connection pool).
 *
 * Builds the database service (single shared connection pool).
 *
 * @param {DatabaseConfig} config - Connection string.
 *
 * @returns {Effect.Effect<IDatabaseService, DatabaseError>} The service, or a
 *   config error.
 */
const createDatabase: (
  config: DatabaseConfig,
) => Effect.Effect<IDatabaseService, DatabaseError> = (
  config: DatabaseConfig,
): Effect.Effect<IDatabaseService, DatabaseError> => {
  if (!(
    is.nonEmptyString(config.host) &&
    is.nonEmptyString(config.name) &&
    is.nonEmptyString(config.user) &&
    is.nonEmptyString(config.password)
  )) {
    return Effect.fail(
      new DatabaseError({
        message: DatabaseMessage.CONFIG_MISSING,
        status: HttpStatus.internal,
      }),
    );
  }
  return Effect.succeed(new DatabaseService(new DrizzleDatabaseDriver(config)));
};

export { createDatabase };
