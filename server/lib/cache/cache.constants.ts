/**
 * Namespaced constants for the cache domain.
 */

/** Default time-to-live per cached concern, in seconds. */
const CacheTtl = {
  STATS: 30,
  QUESTION_COUNT: 3_600,
} as const

/** Cache key builders — the single source of truth for key shapes. */
const CacheKey = {
  stats: (userId: number) => `stats:user:${userId}`,
  questionCount: () => 'questions:count',
} as const

export { CacheKey, CacheTtl }
