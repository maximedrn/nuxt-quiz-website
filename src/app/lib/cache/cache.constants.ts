/**
 * Namespaced constants for the cache domain.
 */

/**
 * Cache operations, for logging and metrics.
 */
const CacheOp = {
  delete: "delete",
  get: "get",
  getOrSet: "getOrSet",
  set: "set",
} as const satisfies Record<string, string>;

type CacheOp = (typeof CacheOp)[keyof typeof CacheOp];

/**
 * Default time-to-live per cached concern, in seconds.
 *
 * `const` object so each reference site is type-checked against the known set
 * of values.
 */
const CacheTtl = {
  questionCount: 3600,
  quizList: 3600,
  stats: 30,
} as const satisfies Record<string, number>;

type CacheTtl = (typeof CacheTtl)[keyof typeof CacheTtl];

const CacheKey = {
  questionCount: (quizId: number) => `questions:count:quiz:${quizId}`,
  quizList: () => "quizzes:list",
  stats: (userId: number) => `stats:user:${userId}`,
} as const satisfies Record<string, (args: number) => string>;

export { CacheKey, CacheOp, CacheTtl };
