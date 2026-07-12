/**
 * Namespaced constants for the auth domain.
 */

/**
 * Invariants of the credential format.
 *
 * `const` object so every reference site is type-checked against the known set
 * of values.
 */
const AuthRules = {
  /**
   * Codes are exactly 8 digits.
   */
  codeLength: 8,
  /**
   * HMAC algorithm used for the deterministic code lookup.
   */
  lookupAlgorithm: "sha256",
} as const satisfies Record<string, string | number>;

type AuthRules = (typeof AuthRules)[keyof typeof AuthRules];

export { AuthRules };
