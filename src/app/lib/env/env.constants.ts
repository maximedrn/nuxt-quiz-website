/**
 * Fallback values applied by the env schema when an env var is absent.
 */
const EnvDefaults = {
  authRateLimitDuration: 60,
  authRateLimitPoints: 5,
  databasePort: 5432,
  rateLimitDuration: 60,
  rateLimitPoints: 100,
  redisUrl: "redis://localhost:6379",
} as const satisfies Record<string, string | number>;

export { EnvDefaults };
