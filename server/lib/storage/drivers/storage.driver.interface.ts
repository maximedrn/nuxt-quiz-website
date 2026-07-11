import type { StorageOperations } from '@/server/lib/storage/storage.types'

/**
 * Low-level storage backend contract. Each interchangeable backend (Drizzle/
 * Postgres, blockchain) implements this. The public service delegates to the
 * driver selected by `STORAGE_DRIVER`.
 */
interface IStorageDriver extends StorageOperations {}

export type { IStorageDriver }
