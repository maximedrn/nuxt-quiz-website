/**
 * Namespaced constants for the database domain.
 */

/**
 * Interchangeable database backends.
 *
 * Kept as a `const` object so every reference site is type-checked against a
 * known driver name.
 */
const DatabaseDriver = {
  drizzle: "drizzle",
} as const satisfies Record<string, string>;

type DatabaseDriver = (typeof DatabaseDriver)[keyof typeof DatabaseDriver];

/**
 * Connection defaults.
 *
 * `PREPARE` is a boolean, which a `const enum` cannot hold (const enums are
 * limited to string/number literals), so this stays a plain `as const` object.
 */
const DatabasePool = {
  /**
   * Disable prepared statements (needed for transaction poolers like
   * PgBouncer).
   */
  prepare: false,
} as const satisfies Record<string, boolean>;

export { DatabaseDriver, DatabasePool };
