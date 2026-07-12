/**
 * Static messages for the auth domain.
 */
const AuthMessage = {
  codeTaken: "This code is already in use — choose another.",
  insertReturnedNoRow: "Insert returned no row.",
  invalidCredentials: "Invalid code.",
  invalidFormat: "Code must be exactly 8 digits.",
} as const satisfies Record<string, string>;

type AuthMessage = (typeof AuthMessage)[keyof typeof AuthMessage];

export { AuthMessage };
