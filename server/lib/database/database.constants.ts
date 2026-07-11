/**
 * Namespaced constants for the database domain.
 */

/** Interchangeable database backends. */
export const DatabaseDriver = { DRIZZLE: 'drizzle' } as const
export type DatabaseDriver = (typeof DatabaseDriver)[keyof typeof DatabaseDriver]

/** Connection defaults. */
export const DatabasePool = {
  /** Disable prepared statements (needed for transaction poolers like PgBouncer). */
  PREPARE: false,
} as const
