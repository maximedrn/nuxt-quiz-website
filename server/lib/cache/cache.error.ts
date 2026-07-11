/**
 * Constant error messages for the cache domain.
 */
const CacheError = {
  OP_FAILED: (op: string, detail: string) => `Cache operation "${op}" failed: ${detail}`,
} as const

export { CacheError }
