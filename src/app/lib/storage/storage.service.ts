import { BaseStorageService } from "@/app/lib/storage/storage.base.ts";

/**
 * Concrete storage service. Currently pure delegation via
 * {@link BaseStorageService}; it is the seam where read caching is layered in
 * the cache phase (`countQuestions` / `getStats`).
 */
class StorageService extends BaseStorageService {}

export { StorageService };
