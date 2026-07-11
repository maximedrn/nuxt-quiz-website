/**
 * Constant error messages for the auth domain.
 *
 * Login/refresh failures deliberately share one vague message so an attacker
 * can't tell "no such code" from "wrong code".
 */
const AuthError = {
  CODE_TAKEN: 'This code is already in use — choose another.',
  INVALID_CREDENTIALS: 'Invalid code.',
  INVALID_REFRESH: 'Session expired — please sign in again.',
  INVALID_ACCESS: 'Invalid or expired access token.',
  OP_FAILED: (op: string, detail: string) => `Auth operation "${op}" failed: ${detail}`,
} as const

export { AuthError }
