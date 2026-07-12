import type { Effect } from "effect";
import type { IDatabaseService } from "@/app/lib/database/database.interface.ts";
import type {
  Database,
  DatabaseError,
} from "@/app/lib/database/database.types.ts";
import type { IDatabaseDriver } from "@/app/lib/database/drivers/database.driver.interface.ts";

/**
 * Common database-service logic: holds the driver and exposes its client and
 * disconnect. Concrete services extend this.
 */
abstract class BaseDatabaseService implements IDatabaseService {
  protected readonly driver: IDatabaseDriver;

  /**
   * @param {IDatabaseDriver} driver - The backing database driver.
   */
  constructor(driver: IDatabaseDriver) {
    this.driver = driver;
  }

  get db(): Database {
    return this.driver.db;
  }

  /**
   * Delegates disconnect to the backing driver.
   *
   * @returns {Effect.Effect<void, DatabaseError>} Success or a tagged database
   *   error.
   */
  disconnect(): Effect.Effect<void, DatabaseError> {
    return this.driver.disconnect();
  }
}

export { BaseDatabaseService };
