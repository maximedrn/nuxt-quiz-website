/**
 * Static messages for the database domain.
 */
const DatabaseMessage = {
  CONFIG_MISSING: "Database connection config is incomplete",
  DISCONNECT_FAILED: "Failed to close the database connection",
} as const satisfies Record<string, string>;

type DatabaseMessage = (typeof DatabaseMessage)[keyof typeof DatabaseMessage];

export { DatabaseMessage };
