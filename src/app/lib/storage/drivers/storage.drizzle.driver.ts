import { desc, eq, inArray } from "drizzle-orm";
import { Effect, Option } from "effect";
import type { Database } from "@/app/lib/database/database.types.ts";
import { questions } from "@/app/lib/database/schema/question.schema.ts";
import { quizzes } from "@/app/lib/database/schema/quiz.schema.ts";
import { quizSessions } from "@/app/lib/database/schema/quiz-session.schema.ts";
import { sessionAnswers } from "@/app/lib/database/schema/session-answer.schema.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import type { IStorageDriver } from "@/app/lib/storage/drivers/storage.driver.interface.ts";
import {
  SessionStatus,
  StorageOp,
} from "@/app/lib/storage/storage.constants.ts";
import { StorageMessage } from "@/app/lib/storage/storage.message.ts";
import { computeStats } from "@/app/lib/storage/storage.stats.ts";
import {
  type NewAnswerInput,
  type NewSessionInput,
  type QuestionRef,
  type SessionPatch,
  type StatsResult,
  StorageError,
  type StoredAnswer,
  type StoredQuestion,
  type StoredQuiz,
  type StoredSession,
} from "@/app/lib/storage/storage.types.ts";

class DrizzleStorageDriver implements IStorageDriver {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private query<A>(
    op: string,
    run: () => Promise<A>,
  ): Effect.Effect<A, StorageError> {
    return Effect.tryPromise({
      catch: (error: unknown): StorageError => {
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }
        return new StorageError({
          message: `${StorageMessage.queryFailed}: ${op}: ${errorMessage}`,
          status: HttpStatus.internal,
        });
      },
      try: run,
    });
  }

  listQuizzes(): Effect.Effect<StoredQuiz[], StorageError> {
    return this.query(StorageOp.listQuizzes, (): Promise<StoredQuiz[]> =>
      this.db.select().from(quizzes).orderBy(quizzes.createdAt),
    );
  }

  getQuiz(id: number): Effect.Effect<Option.Option<StoredQuiz>, StorageError> {
    return this.query(
      StorageOp.getQuiz,
      async (): Promise<StoredQuiz | undefined> => {
        const rows: StoredQuiz[] = await this.db
          .select()
          .from(quizzes)
          .where(eq(quizzes.id, id))
          .limit(1);
        return rows[0];
      },
    ).pipe(Effect.map(Option.fromNullable));
  }

  listQuestionRefs(quizId: number): Effect.Effect<QuestionRef[], StorageError> {
    return this.query(StorageOp.listQuestionRefs, (): Promise<QuestionRef[]> =>
      this.db
        .select({ id: questions.id, number: questions.number })
        .from(questions)
        .where(eq(questions.quizId, quizId)),
    );
  }

  countQuestions(quizId: number): Effect.Effect<number, StorageError> {
    return this.query(StorageOp.countQuestions, async (): Promise<number> => {
      const rows: Array<{ id: number }> = await this.db
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.quizId, quizId));
      return rows.length;
    });
  }

  getQuestionsByIds(
    ids: number[],
  ): Effect.Effect<StoredQuestion[], StorageError> {
    if (ids.length === 0) {
      return Effect.succeed([]);
    }
    return this.query(StorageOp.getQuestionsByIds, () =>
      this.db.select().from(questions).where(inArray(questions.id, ids)),
    );
  }

  createSession(
    input: NewSessionInput,
  ): Effect.Effect<StoredSession, StorageError> {
    return this.query(StorageOp.createSession, async () => {
      const rows: StoredSession[] = await this.db
        .insert(quizSessions)
        .values({
          mode: input.mode,
          questionIds: input.questionIds,
          quizId: input.quizId,
          status: SessionStatus.inProgress,
          userId: input.userId,
        })
        .returning();
      const row: StoredSession | undefined = rows[0];
      if (!row) {
        throw new Error(StorageMessage.sessionInsertFailed);
      }
      return row;
    });
  }

  getSession(
    id: number,
  ): Effect.Effect<Option.Option<StoredSession>, StorageError> {
    return this.query(
      StorageOp.getSession,
      async (): Promise<StoredSession | undefined> => {
        const rows: StoredSession[] = await this.db
          .select()
          .from(quizSessions)
          .where(eq(quizSessions.id, id))
          .limit(1);
        return rows[0];
      },
    ).pipe(
      Effect.map(
        (row: StoredSession | undefined): Option.Option<StoredSession> => {
          if (row) {
            return Option.some(row);
          }
          return Option.none();
        },
      ),
    );
  }

  listSessions(userId: number): Effect.Effect<StoredSession[], StorageError> {
    return this.query(StorageOp.listSessions, () =>
      this.db
        .select()
        .from(quizSessions)
        .where(eq(quizSessions.userId, userId))
        .orderBy(desc(quizSessions.startedAt)),
    );
  }

  updateSession(
    id: number,
    patch: SessionPatch,
  ): Effect.Effect<void, StorageError> {
    return this.query(StorageOp.updateSession, async () => {
      await this.db
        .update(quizSessions)
        .set(patch)
        .where(eq(quizSessions.id, id));
    });
  }

  createAnswer(input: NewAnswerInput): Effect.Effect<void, StorageError> {
    return this.query(StorageOp.createAnswer, async () => {
      await this.db.insert(sessionAnswers).values(input);
    });
  }

  listAnswers(sessionId: number): Effect.Effect<StoredAnswer[], StorageError> {
    return this.query(StorageOp.listAnswers, () =>
      this.db
        .select()
        .from(sessionAnswers)
        .where(eq(sessionAnswers.sessionId, sessionId))
        .orderBy(sessionAnswers.answeredAt),
    );
  }

  getStats(userId: number): Effect.Effect<StatsResult, StorageError> {
    return this.query(StorageOp.getStats, async () => {
      const sessions: StoredSession[] = await this.db
        .select()
        .from(quizSessions)
        .where(eq(quizSessions.userId, userId));
      const sessionIds: number[] = sessions.map(
        (session: StoredSession) => session.id,
      );
      let answers: StoredAnswer[] = [];
      if (sessionIds.length > 0) {
        answers = await this.db
          .select()
          .from(sessionAnswers)
          .where(inArray(sessionAnswers.sessionId, sessionIds));
      }
      const meta: Array<{ id: number; number: number; title: string }> =
        await this.db
          .select({
            id: questions.id,
            number: questions.number,
            title: questions.title,
          })
          .from(questions);
      const questionMeta: Map<number, { number: number; title: string }> =
        new Map(
          meta.map(
            ({
              id,
              number,
              title,
            }: {
              id: number;
              number: number;
              title: string;
            }) => [id, { number, title }],
          ),
        );
      return computeStats({
        answers,
        questionMeta,
        sessions,
        totalQuestions: meta.length,
      });
    });
  }
}

export { DrizzleStorageDriver };
