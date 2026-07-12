/**
 * Namespaced constants for the storage domain.
 */

/**
 * Storage operations, for logging and error messages.
 */
const StorageOp = {
  countQuestions: "countQuestions",
  createAnswer: "createAnswer",
  createSession: "createSession",
  getQuestionsByIds: "getQuestionsByIds",
  getQuiz: "getQuiz",
  getSession: "getSession",
  getStats: "getStats",
  listAnswers: "listAnswers",
  listQuestionRefs: "listQuestionRefs",
  listQuizzes: "listQuizzes",
  listSessions: "listSessions",
  updateSession: "updateSession",
} as const satisfies Record<string, string>;

type StorageOp = (typeof StorageOp)[keyof typeof StorageOp];

/**
 * Row-count caps for the stats "trend" and "weakest" lists.
 *
 * `const` object so each reference site is type-checked against the known set
 * of values.
 */
const StorageLimits = {
  trend: 10,
  weakest: 5,
} as const satisfies Record<string, number>;

type StorageLimits = (typeof StorageLimits)[keyof typeof StorageLimits];

/**
 * Kept as `const`-object unions (not `const enum`) because these values are
 * imported by Drizzle schema files, which drizzle-kit loads via Node's CJS
 * transformer — that loader cannot resolve cross-file const enums.
 */
const SessionMode = {
  random: "random",
  sequential: "sequential",
} as const satisfies Record<string, string>;

type SessionMode = (typeof SessionMode)[keyof typeof SessionMode];

const SessionStatus = {
  completed: "completed",
  inProgress: "in_progress",
} as const satisfies Record<string, string>;

type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export { SessionMode, SessionStatus, StorageLimits, StorageOp };
