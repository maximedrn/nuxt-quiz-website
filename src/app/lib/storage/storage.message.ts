/**
 * Static messages for the storage domain.
 */
const StorageMessage = {
  queryFailed: "Storage query failed",
  sessionInsertFailed: "Failed to create session — no row returned.",
} as const satisfies Record<string, string>;

type StorageMessage = (typeof StorageMessage)[keyof typeof StorageMessage];

export { StorageMessage };
