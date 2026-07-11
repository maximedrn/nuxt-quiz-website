import type { IStorageDriver } from '@/server/lib/storage/drivers/storage.driver.interface'
import { BaseStorageService } from '@/server/lib/storage/storage.base'

/**
 * Concrete storage service. Currently pure delegation via
 * {@link BaseStorageService}; it is the seam where read caching is layered in
 * the cache phase (`countQuestions` / `getStats`).
 */
class StorageService extends BaseStorageService {
  /**
   * @param {IStorageDriver} driver - Backend selected by the factory.
   */
  constructor(driver: IStorageDriver) {
    super(driver)
  }
}

export { StorageService }
