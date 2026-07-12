import { Effect } from "effect";
import type { Database } from "@/app/lib/database/database.types.ts";
import { DrizzleStorageDriver } from "@/app/lib/storage/drivers/storage.drizzle.driver.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import { StorageService } from "@/app/lib/storage/storage.service.ts";
import type { StorageError } from "@/app/lib/storage/storage.types.ts";

const createStorage: (
  db: Database,
) => Effect.Effect<IStorageService, StorageError> = (
  db: Database,
): Effect.Effect<IStorageService, StorageError> =>
  Effect.succeed(new StorageService(new DrizzleStorageDriver(db)));

export { createStorage };
