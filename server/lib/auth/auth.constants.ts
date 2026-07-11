/**
 * Namespaced constants for the auth domain.
 */

/** Invariants of the credential and token formats. */
const AuthRules = {
  /** Codes are exactly 8 digits. */
  CODE_LENGTH: 8,
  /** Bytes of entropy in an opaque refresh token. */
  REFRESH_TOKEN_BYTES: 32,
  /** HMAC algorithm used for the deterministic code lookup. */
  LOOKUP_ALGORITHM: 'sha256',
  /** JWT signing algorithm for access tokens. */
  JWT_ALGORITHM: 'HS256',
} as const

export { AuthRules }
