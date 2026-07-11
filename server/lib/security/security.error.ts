/**
 * Constant error messages for the security domain.
 */
const SecurityError = {
  CONSUME_FAILED: (detail: string) => `Rate-limit check failed: ${detail}`,
} as const

export { SecurityError }
