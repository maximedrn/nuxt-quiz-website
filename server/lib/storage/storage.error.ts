/**
 * Constant error messages for the storage domain.
 */
const StorageError = {
  QUERY_FAILED: (op: string, detail: string) => `Storage operation "${op}" failed: ${detail}`,
  SESSION_INSERT_FAILED: 'Failed to create session — no row returned.',
  NOT_IMPLEMENTED: (op: string) =>
    `Storage operation "${op}" is not wired to the deployed contract yet.`,
} as const

export { StorageError }
