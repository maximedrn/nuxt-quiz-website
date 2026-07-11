/**
 * Namespaced constants for the security domain.
 */

/** Redis key prefixes that isolate each limiter's counters. */
const RateLimitPrefix = {
  GLOBAL: 'rl:global',
  AUTH: 'rl:auth',
} as const

/** Discriminants for which limiter a request is charged against. */
const RateLimitKind = {
  GLOBAL: 'global',
  AUTH: 'auth',
} as const

export { RateLimitKind, RateLimitPrefix }
