import type { Effect, Option } from "effect";
import { Data } from "effect";
import type { RequireAtLeastOne } from "type-fest";
import type { HttpStatus } from "@/app/lib/http/http.status.ts";
import type {
  SessionMode,
  SessionStatus,
} from "@/app/lib/storage/storage.constants.ts";

type AnswerIndex = number;

interface TrendPoint {
  finishedAt: string;
  percentage: number;
  sessionId: number;
}

interface WeakQuestion {
  attempts: number;
  number: number;
  title: string;
  wrongCount: number;
  wrongRate: number;
}

interface StatsResult {
  averageScorePercentage: number | null;
  bestScorePercentage: number | null;
  completedSessions: number;
  currentStreakDays: number;
  overallAccuracyPercentage: number | null;
  totalAnswered: number;
  totalQuestions: number;
  trend: TrendPoint[];
  weakest: WeakQuestion[];
}

/**
 * Tagged error for storage domain failures.
 */
class StorageError extends Data.TaggedError("StorageError")<{
  readonly message: string;
  readonly status: HttpStatus;
}> {}

/**
 * Lightweight question reference used when building a session.
 */
interface QuestionRef {
  readonly id: number;
  readonly number: number;
}

/**
 * A full question row as stored, including the answer key (server-side only).
 *
 * `options` is the ordered choice array; `correctIndex` is the 0-based index of
 * the correct option, so a question can carry any number of choices.
 */
interface StoredQuestion {
  readonly code: string | null;
  readonly correctIndex: AnswerIndex;
  readonly explanation: string;
  readonly id: number;
  readonly number: number;
  readonly options: string[];
  readonly question: string;
  readonly title: string;
}

/**
 * A persisted training session.
 */
interface StoredSession {
  readonly finishedAt: Date | null;
  readonly id: number;
  readonly mode: SessionMode;
  readonly questionIds: number[];
  readonly score: number | null;
  readonly startedAt: Date;
  readonly status: SessionStatus;
  readonly userId: number;
}

/**
 * A persisted answer within a session. `selectedIndex` points into the
 * question's `options`.
 */
interface StoredAnswer {
  readonly answeredAt: Date;
  readonly id: number;
  readonly isCorrect: boolean;
  readonly questionId: number;
  readonly selectedIndex: AnswerIndex;
  readonly sessionId: number;
}

/**
 * A quiz as stored in the database.
 */
interface StoredQuiz {
  readonly createdAt: Date;
  readonly description: string | null;
  readonly id: number;
  readonly slug: string;
  readonly title: string;
}

/**
 * Input to create a new session.
 */
interface NewSessionInput {
  readonly mode: SessionMode;
  readonly questionIds: number[];
  readonly quizId: number;
  readonly userId: number;
}

/**
 * Partial update to a session — at least one field is required.
 */
type SessionPatch = RequireAtLeastOne<{
  status: SessionStatus;
  score: number;
  finishedAt: Date;
}>;

/**
 * Input to record an answer.
 */
interface NewAnswerInput {
  readonly isCorrect: boolean;
  readonly questionId: number;
  readonly selectedIndex: AnswerIndex;
  readonly sessionId: number;
}

/**
 * The persistence contract shared by every backend.
 *
 * Both the public service (`IStorageService`) and each low-level driver
 * (`IStorageDriver`) implement exactly these operations, so a Postgres backend
 * and an on-chain backend are drop-in interchangeable. Nullable reads use
 * `Option`; every method is fallible and returns an `Effect`.
 */
interface StorageOperations {
  countQuestions: (quizId: number) => Effect.Effect<number, StorageError>;
  createAnswer: (input: NewAnswerInput) => Effect.Effect<void, StorageError>;
  createSession: (
    input: NewSessionInput,
  ) => Effect.Effect<StoredSession, StorageError>;
  getQuestionsByIds: (
    ids: number[],
  ) => Effect.Effect<StoredQuestion[], StorageError>;
  getQuiz: (
    id: number,
  ) => Effect.Effect<Option.Option<StoredQuiz>, StorageError>;
  getSession: (
    id: number,
  ) => Effect.Effect<Option.Option<StoredSession>, StorageError>;
  getStats: (userId: number) => Effect.Effect<StatsResult, StorageError>;
  listAnswers: (
    sessionId: number,
  ) => Effect.Effect<StoredAnswer[], StorageError>;
  listQuestionRefs: (
    quizId: number,
  ) => Effect.Effect<QuestionRef[], StorageError>;
  listQuizzes: () => Effect.Effect<StoredQuiz[], StorageError>;
  listSessions: (
    userId: number,
  ) => Effect.Effect<StoredSession[], StorageError>;
  updateSession: (
    id: number,
    patch: SessionPatch,
  ) => Effect.Effect<void, StorageError>;
}

export {
  type AnswerIndex,
  type NewAnswerInput,
  type NewSessionInput,
  type QuestionRef,
  type SessionPatch,
  type StatsResult,
  StorageError,
  type StorageOperations,
  type StoredAnswer,
  type StoredQuestion,
  type StoredQuiz,
  type StoredSession,
  type TrendPoint,
  type WeakQuestion,
};
