/**
 * Namespaced constants for the auth domain.
 */

/** Invariants of the credential format. */
const AuthRules = {
  /** Codes are exactly 8 digits. */
  CODE_LENGTH: 8,
  /** HMAC algorithm used for the deterministic code lookup. */
  LOOKUP_ALGORITHM: 'sha256',
} as const

export { AuthRules }
