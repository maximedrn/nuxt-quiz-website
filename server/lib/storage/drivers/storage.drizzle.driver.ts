import { desc, eq, inArray } from 'drizzle-orm'
import { Effect, Option } from 'effect'
import type { Database } from '@/server/lib/database/database.types'
import { questions } from '@/server/lib/database/schema/question.schema'
import { quizSessions } from '@/server/lib/database/schema/quiz-session.schema'
import { sessionAnswers } from '@/server/lib/database/schema/session-answer.schema'
import { HttpStatus } from '@/server/lib/http/http.status'
import type { IStorageDriver } from '@/server/lib/storage/drivers/storage.driver.interface'
import { StorageMessage } from '@/server/lib/storage/storage.message'
import { computeStats } from '@/server/lib/storage/storage.stats'
import {
  StorageError,
  type NewAnswerInput,
  type NewSessionInput,
  type QuestionRef,
  type SessionPatch,
  type StoredAnswer,
  type StoredQuestion,
  type StoredSession,
} from '@/server/lib/storage/storage.types'
import type { StatsResult } from '@/shared/types'

/**
 * Postgres-backed storage driver.
 *
 * Wraps every Drizzle query in an `Effect` so failures surface as typed
 * `StorageError` values instead of thrown exceptions. Stats are computed
 * in-process by the shared `computeStats` helper from raw rows — the same
 * code path the blockchain driver uses.
 */
class DrizzleStorageDriver implements IStorageDriver {
  private readonly db: Database

  /**
   * @param {Database} db - Shared Drizzle client (see `@/server/lib/database`).
   */
  constructor(db: Database) {
    this.db = db
  }

  /**
   * Wraps a query promise into an `Effect`, tagging failures as `StorageError`.
   *
   * @param {string} op - Operation name for error messages.
   * @param {() => Promise<A>} run - The query to execute.
   *
   * @returns {Effect.Effect<A, StorageError>} The query result or a storage error.
   */
  private query<A>(op: string, run: () => Promise<A>): Effect.Effect<A, StorageError> {
    return Effect.tryPromise({
      try: run,
      catch: (e): StorageError =>
        new StorageError({
          message: `${StorageMessage.QUERY_FAILED}: ${op}: ${e instanceof Error ? e.message : String(e)}`,
          status: HttpStatus.INTERNAL,
        }),
    })
  }

  listQuestionRefs(): Effect.Effect<QuestionRef[], StorageError> {
    return this.query('listQuestionRefs', () =>
      this.db.select({ id: questions.id, number: questions.number }).from(questions),
    )
  }

  countQuestions(): Effect.Effect<number, StorageError> {
    return this.query('countQuestions', async () => {
      const rows = await this.db.select({ id: questions.id }).from(questions)
      return rows.length
    })
  }

  getQuestionsByIds(ids: number[]): Effect.Effect<StoredQuestion[], StorageError> {
    if (ids.length === 0) return Effect.succeed([])
    return this.query('getQuestionsByIds', () =>
      this.db.select().from(questions).where(inArray(questions.id, ids)),
    )
  }

  createSession(input: NewSessionInput): Effect.Effect<StoredSession, StorageError> {
    return this.query('createSession', async () => {
      const [row] = await this.db
        .insert(quizSessions)
        .values({
          userId: input.userId,
          questionIds: input.questionIds,
          mode: input.mode,
          status: 'in_progress',
        })
        .returning()
      if (!row) throw new Error(StorageMessage.SESSION_INSERT_FAILED)
      return row satisfies StoredSession
    })
  }

  getSession(id: number): Effect.Effect<Option.Option<StoredSession>, StorageError> {
    return this.query('getSession', async (): Promise<StoredSession | undefined> => {
      const [row] = await this.db
        .select()
        .from(quizSessions)
        .where(eq(quizSessions.id, id))
        .limit(1)
      return row
    }).pipe(Effect.map((row): Option.Option<StoredSession> => (row ? Option.some(row) : Option.none())))
  }

  listSessions(userId: number): Effect.Effect<StoredSession[], StorageError> {
    return this.query('listSessions', () =>
      this.db
        .select()
        .from(quizSessions)
        .where(eq(quizSessions.userId, userId))
        .orderBy(desc(quizSessions.startedAt)),
    )
  }

  updateSession(id: number, patch: SessionPatch): Effect.Effect<void, StorageError> {
    return this.query('updateSession', async () => {
      await this.db.update(quizSessions).set(patch).where(eq(quizSessions.id, id))
    })
  }

  createAnswer(input: NewAnswerInput): Effect.Effect<void, StorageError> {
    return this.query('createAnswer', async () => {
      await this.db.insert(sessionAnswers).values(input)
    })
  }

  listAnswers(sessionId: number): Effect.Effect<StoredAnswer[], StorageError> {
    return this.query('listAnswers', () =>
      this.db
        .select()
        .from(sessionAnswers)
        .where(eq(sessionAnswers.sessionId, sessionId))
        .orderBy(sessionAnswers.answeredAt),
    )
  }

  getStats(userId: number): Effect.Effect<StatsResult, StorageError> {
    return this.query('getStats', async () => {
      const sessions = await this.db
        .select()
        .from(quizSessions)
        .where(eq(quizSessions.userId, userId))
      const sessionIds = sessions.map((s) => s.id)
      const answers =
        sessionIds.length > 0
          ? await this.db
              .select()
              .from(sessionAnswers)
              .where(inArray(sessionAnswers.sessionId, sessionIds))
          : []
      const meta = await this.db
        .select({ id: questions.id, number: questions.number, title: questions.title })
        .from(questions)
      const questionMeta = new Map(meta.map((m) => [m.id, { number: m.number, title: m.title }]))
      return computeStats({
        totalQuestions: meta.length,
        sessions,
        answers,
        questionMeta,
      })
    })
  }
}

export { DrizzleStorageDriver }
