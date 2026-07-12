import type { StorageOperations } from "@/app/lib/storage/storage.types.ts";

/**
 * Low-level storage backend contract. The public service delegates to the
 * active driver.
 */
interface IStorageDriver extends StorageOperations {}

export type { IStorageDriver };
