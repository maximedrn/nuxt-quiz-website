/**
 * Namespaced constants for the security domain.
 */

/**
 * Redis key prefixes that isolate each limiter's counters.
 *
 * `const` object so each reference site is type-checked against the known set
 * of values.
 */
const RateLimitPrefix = {
  auth: "rl:auth",
  global: "rl:global",
} as const satisfies Record<string, string>;

type RateLimitPrefix = (typeof RateLimitPrefix)[keyof typeof RateLimitPrefix];

/**
 * Discriminants for which limiter a request is charged against.
 *
 * `const` object — same rationale as `RateLimitPrefix`.
 */
const RateLimitKind = {
  auth: "auth",
  global: "global",
} as const satisfies Record<string, string>;

type RateLimitKind = (typeof RateLimitKind)[keyof typeof RateLimitKind];

/**
 * Fallback client IP when no address can be resolved.
 */
const UnknownIp: string = "unknown";

/**
 * Env sentinel that enables trusted-proxy `X-Forwarded-For` parsing.
 */
const TrustedProxyOn: string = "true";

/**
 * HTTP headers written or read by the rate-limit middleware.
 */
const RateLimitHeader = {
  forwardedFor: "x-forwarded-for",
  retryAfter: "Retry-After",
} as const satisfies Record<string, string>;

type RateLimitHeader = (typeof RateLimitHeader)[keyof typeof RateLimitHeader];

export {
  RateLimitHeader,
  RateLimitKind,
  RateLimitPrefix,
  TrustedProxyOn,
  UnknownIp,
};
