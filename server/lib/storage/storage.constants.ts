/**
 * Namespaced constants for the storage domain.
 */

/** How many rows the stats "trend" and "weakest" lists surface. */
const StorageLimits = {
  TREND: 10,
  WEAKEST: 5,
} as const

export { StorageLimits }
