import { desc, eq, inArray } from 'drizzle-orm'
import { ResultAsync } from 'neverthrow'
import { createNone, createSome, type Option } from 'option-t/plain_option'
import type { Database } from '@/server/lib/database/database.types'
import { questions } from '@/server/lib/database/schema/question.schema'
import { quizSessions } from '@/server/lib/database/schema/quiz-session.schema'
import { sessionAnswers } from '@/server/lib/database/schema/session-answer.schema'
import type { IStorageDriver } from '@/server/lib/storage/drivers/storage.driver.interface'
import { StorageError } from '@/server/lib/storage/storage.error'
import { computeStats } from '@/server/lib/storage/storage.stats'
import type {
  NewAnswerInput,
  NewSessionInput,
  QuestionRef,
  SessionPatch,
  StoredAnswer,
  StoredQuestion,
  StoredSession,
} from '@/server/lib/storage/storage.types'
import type { StatsResult } from '@/shared/types'

/**
 * Postgres-backed storage driver.
 *
 * Wraps every Drizzle query in a `ResultAsync` so failures surface as typed
 * errors instead of thrown exceptions. Stats are computed in-process by the
 * shared `computeStats` helper from raw rows — the same code path the
 * blockchain driver uses.
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
   * Wraps a query promise into a `ResultAsync`, tagging failures with the
   * operation name for debuggable error messages.
   *
   * @param {string} op - Operation name, used in the error message.
   * @param {() => Promise<T>} run - The query to execute.
   *
   * @returns {ResultAsync<T, string>} The query result or a storage error.
   */
  private query<T>(op: string, run: () => Promise<T>): ResultAsync<T, string> {
    return ResultAsync.fromPromise(run(), (err) =>
      StorageError.QUERY_FAILED(op, err instanceof Error ? err.message : String(err)),
    )
  }

  listQuestionRefs(): ResultAsync<QuestionRef[], string> {
    return this.query('listQuestionRefs', () =>
      this.db.select({ id: questions.id, number: questions.number }).from(questions),
    )
  }

  countQuestions(): ResultAsync<number, string> {
    return this.query('countQuestions', async () => {
      const rows = await this.db.select({ id: questions.id }).from(questions)
      return rows.length
    })
  }

  getQuestionsByIds(ids: number[]): ResultAsync<StoredQuestion[], string> {
    if (ids.length === 0) return ResultAsync.fromSafePromise(Promise.resolve([]))
    return this.query('getQuestionsByIds', () =>
      this.db.select().from(questions).where(inArray(questions.id, ids)),
    )
  }

  createSession(input: NewSessionInput): ResultAsync<StoredSession, string> {
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
      if (!row) throw new Error(StorageError.SESSION_INSERT_FAILED)
      return row satisfies StoredSession
    })
  }

  getSession(id: number): ResultAsync<Option<StoredSession>, string> {
    return this.query('getSession', async () => {
      const [row] = await this.db
        .select()
        .from(quizSessions)
        .where(eq(quizSessions.id, id))
        .limit(1)
      return row ? createSome(row satisfies StoredSession) : createNone()
    })
  }

  listSessions(userId: number): ResultAsync<StoredSession[], string> {
    return this.query('listSessions', () =>
      this.db
        .select()
        .from(quizSessions)
        .where(eq(quizSessions.userId, userId))
        .orderBy(desc(quizSessions.startedAt)),
    )
  }

  updateSession(id: number, patch: SessionPatch): ResultAsync<void, string> {
    return this.query('updateSession', async () => {
      await this.db.update(quizSessions).set(patch).where(eq(quizSessions.id, id))
    })
  }

  createAnswer(input: NewAnswerInput): ResultAsync<void, string> {
    return this.query('createAnswer', async () => {
      await this.db.insert(sessionAnswers).values(input)
    })
  }

  listAnswers(sessionId: number): ResultAsync<StoredAnswer[], string> {
    return this.query('listAnswers', () =>
      this.db
        .select()
        .from(sessionAnswers)
        .where(eq(sessionAnswers.sessionId, sessionId))
        .orderBy(sessionAnswers.answeredAt),
    )
  }

  getStats(userId: number): ResultAsync<StatsResult, string> {
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
