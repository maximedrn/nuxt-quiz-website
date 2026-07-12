/**
 * Namespaced defaults and discriminant values for the environment domain.
 *
 * Values are SCREAMING_SNAKE_CASE and grouped under PascalCase objects so no
 * bare `export const` leaks into the module scope.
 */

/** Storage backend discriminants — mirrors `STORAGE_DRIVER`. */
const StorageDriverKind = {
  POSTGRES: 'postgres',
  BLOCKCHAIN: 'blockchain',
} as const

/** Fallback values applied by the Zod schema when an env var is absent. */
const EnvDefaults = {
  REDIS_URL: 'redis://localhost:6379',
  STORAGE_DRIVER: StorageDriverKind.POSTGRES,
  /** Global rate-limit budget per IP per window. */
  RATE_LIMIT_POINTS: 100,
  RATE_LIMIT_DURATION: 60,
  /** Stricter budget for `/api/auth/*` (anti-bruteforce). */
  AUTH_RATE_LIMIT_POINTS: 5,
  AUTH_RATE_LIMIT_DURATION: 60,
} as const

export { EnvDefaults, StorageDriverKind }
