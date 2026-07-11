import { Data } from 'effect'
import type { Effect, Option } from 'effect'
import type { RequireAtLeastOne } from 'type-fest'
import { HttpStatus } from '@/server/lib/http/http.status'
import type { AnswerLetter, SessionMode, SessionStatus, StatsResult } from '@/shared/types'

/** Tagged error for storage domain failures. */
export class StorageError extends Data.TaggedError('StorageError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

/** Lightweight question reference used when building a session. */
interface QuestionRef {
  readonly id: number
  readonly number: number
}

/** A full question row as stored, including the answer key (server-side only). */
interface StoredQuestion {
  readonly id: number
  readonly number: number
  readonly title: string
  readonly question: string
  readonly code: string | null
  readonly optionA: string
  readonly optionB: string
  readonly optionC: string
  readonly optionD: string
  readonly correctAnswer: AnswerLetter
  readonly explanation: string
}

/** A persisted training session. */
interface StoredSession {
  readonly id: number
  readonly userId: number
  readonly questionIds: number[]
  readonly mode: SessionMode
  readonly status: SessionStatus
  readonly score: number | null
  readonly startedAt: Date
  readonly finishedAt: Date | null
}

/** A persisted answer within a session. */
interface StoredAnswer {
  readonly id: number
  readonly sessionId: number
  readonly questionId: number
  readonly selected: AnswerLetter
  readonly isCorrect: boolean
  readonly answeredAt: Date
}

/** Input to create a new session. */
interface NewSessionInput {
  readonly userId: number
  readonly questionIds: number[]
  readonly mode: SessionMode
}

/** Partial update to a session — at least one field is required. */
type SessionPatch = RequireAtLeastOne<{
  status: SessionStatus
  score: number
  finishedAt: Date
}>

/** Input to record an answer. */
interface NewAnswerInput {
  readonly sessionId: number
  readonly questionId: number
  readonly selected: AnswerLetter
  readonly isCorrect: boolean
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
  listQuestionRefs(): Effect.Effect<QuestionRef[], StorageError>
  countQuestions(): Effect.Effect<number, StorageError>
  getQuestionsByIds(ids: number[]): Effect.Effect<StoredQuestion[], StorageError>
  createSession(input: NewSessionInput): Effect.Effect<StoredSession, StorageError>
  getSession(id: number): Effect.Effect<Option.Option<StoredSession>, StorageError>
  listSessions(userId: number): Effect.Effect<StoredSession[], StorageError>
  updateSession(id: number, patch: SessionPatch): Effect.Effect<void, StorageError>
  createAnswer(input: NewAnswerInput): Effect.Effect<void, StorageError>
  listAnswers(sessionId: number): Effect.Effect<StoredAnswer[], StorageError>
  getStats(userId: number): Effect.Effect<StatsResult, StorageError>
}

export type {
  NewAnswerInput,
  NewSessionInput,
  QuestionRef,
  SessionPatch,
  StorageOperations,
  StoredAnswer,
  StoredQuestion,
  StoredSession,
}
