import { Effect } from 'effect'
import { useDatabase } from '@/server/lib/database/database.context'
import { useEnv } from '@/server/lib/env/env.context'
import { createStorage } from '@/server/lib/storage/storage.factory'
import type { IStorageService } from '@/server/lib/storage/storage.interface'

let _storage: IStorageService | undefined

/**
 * Lazily-built, process-wide storage service for the configured backend.
 *
 * Async because the blockchain backend is dynamically imported; runs the
 * construction effect and memoizes the service, dying with an H3 error if the
 * backend can't be built.
 *
 * @returns {Promise<IStorageService>} The storage service.
 */
export async function useQuizStorage(): Promise<IStorageService> {
  if (!_storage) {
    _storage = await Effect.runPromise(
      createStorage(useEnv().config, useDatabase().db).pipe(
        Effect.catchAll((error) =>
          Effect.die(createError({ statusCode: error.status, statusMessage: error.message })),
        ),
      ),
    )
  }
  return _storage
}
