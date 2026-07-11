import { BaseDatabaseService } from '@/server/lib/database/database.base'
import type { IDatabaseDriver } from '@/server/lib/database/drivers/database.driver.interface'

/**
 * Concrete database service. Pure delegation via {@link BaseDatabaseService}.
 */
export class DatabaseService extends BaseDatabaseService {
  /**
   * @param {IDatabaseDriver} driver - The backing database driver.
   */
  constructor(driver: IDatabaseDriver) {
    super(driver)
  }
}
