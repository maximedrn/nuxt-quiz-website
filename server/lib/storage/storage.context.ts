import { useDatabase } from '@/server/lib/database/database.context'
import { useEnv } from '@/server/lib/env/env.context'
import { createStorage } from '@/server/lib/storage/storage.factory'
import type { IStorageService } from '@/server/lib/storage/storage.interface'

let _storage: IStorageService | undefined

/**
 * Lazily-built, process-wide storage service for the configured backend.
 *
 * Async because the blockchain backend is dynamically imported; the built
 * service is memoized so only the first call pays the construction cost.
 *
 * @returns {Promise<IStorageService>} The storage service.
 */
export async function useQuizStorage(): Promise<IStorageService> {
  if (!_storage) {
    const result = await createStorage(useEnv().config, useDatabase().db)
    if (result.isErr()) {
      throw createError({ statusCode: 500, statusMessage: result.error })
    }
    _storage = result.value
  }
  return _storage
}
