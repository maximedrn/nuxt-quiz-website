import type { Effect } from 'effect'
import type { IDatabaseService } from '@/server/lib/database/database.interface'
import type { Database, DatabaseError } from '@/server/lib/database/database.types'
import type { IDatabaseDriver } from '@/server/lib/database/drivers/database.driver.interface'

/**
 * Common database-service logic: holds the driver and exposes its client and
 * disconnect. Concrete services extend this.
 */
export abstract class BaseDatabaseService implements IDatabaseService {
  protected readonly driver: IDatabaseDriver

  /**
   * @param {IDatabaseDriver} driver - The backing database driver.
   */
  protected constructor(driver: IDatabaseDriver) {
    this.driver = driver
  }

  get db(): Database {
    return this.driver.db
  }

  /**
   * Delegates disconnect to the backing driver.
   *
   * @returns {Effect.Effect<void, DatabaseError>} Success or a tagged database error.
   */
  disconnect(): Effect.Effect<void, DatabaseError> {
    return this.driver.disconnect()
  }
}
