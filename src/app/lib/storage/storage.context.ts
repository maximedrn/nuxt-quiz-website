import { Effect } from "effect";
import { useDatabase } from "@/app/lib/database/database.context.ts";
import type { IDatabaseService } from "@/app/lib/database/database.interface.ts";
import { createStorage } from "@/app/lib/storage/storage.factory.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type { StorageError } from "@/app/lib/storage/storage.types.ts";

let _storage: IStorageService | undefined;

/**
 * Lazily-built, process-wide storage service.
 *
 * @returns {Promise<IStorageService>} The storage service.
 */
const useQuizStorage: () => Promise<IStorageService> =
  async (): Promise<IStorageService> => {
    if (!_storage) {
      const database: IDatabaseService = useDatabase();
      _storage = await Effect.runPromise(
        createStorage(database.db).pipe(
          Effect.catchAll(
            (error: StorageError): Effect.Effect<never, unknown> =>
              Effect.die(
                createError({
                  statusCode: error.status,
                  statusMessage: error.message,
                }),
              ),
          ),
        ),
      );
    }
    return _storage;
  };

export { useQuizStorage };
