/**
 * Static messages for the security domain.
 */
const SecurityMessage = {
  consumeFailed: "Rate-limit check failed",
  redisUrlMissing: "REDIS_URL is required to initialize the security service",
  tooManyRequests: "Too many requests — please slow down.",
} as const satisfies Record<string, string>;

type SecurityMessage = (typeof SecurityMessage)[keyof typeof SecurityMessage];

export { SecurityMessage };
