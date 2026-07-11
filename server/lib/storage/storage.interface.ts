import type { StorageOperations } from '@/server/lib/storage/storage.types'

/**
 * Public storage contract. Consumers (route handlers, other services) type
 * against this and never touch a concrete driver or ORM. Its shape is the
 * backend-agnostic {@link StorageOperations}.
 */
interface IStorageService extends StorageOperations {}

export type { IStorageService }
