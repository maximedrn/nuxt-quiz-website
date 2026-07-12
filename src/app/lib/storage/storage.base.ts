import type { Effect, Option } from "effect";
import type { IStorageDriver } from "@/app/lib/storage/drivers/storage.driver.interface.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  NewAnswerInput,
  NewSessionInput,
  QuestionRef,
  SessionPatch,
  StatsResult,
  StorageError,
  StoredAnswer,
  StoredQuestion,
  StoredQuiz,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

abstract class BaseStorageService implements IStorageService {
  protected readonly driver: IStorageDriver;

  constructor(driver: IStorageDriver) {
    this.driver = driver;
  }

  listQuizzes(): Effect.Effect<StoredQuiz[], StorageError> {
    return this.driver.listQuizzes();
  }

  getQuiz(id: number): Effect.Effect<Option.Option<StoredQuiz>, StorageError> {
    return this.driver.getQuiz(id);
  }

  listQuestionRefs(quizId: number): Effect.Effect<QuestionRef[], StorageError> {
    return this.driver.listQuestionRefs(quizId);
  }

  countQuestions(quizId: number): Effect.Effect<number, StorageError> {
    return this.driver.countQuestions(quizId);
  }

  getQuestionsByIds(
    ids: number[],
  ): Effect.Effect<StoredQuestion[], StorageError> {
    return this.driver.getQuestionsByIds(ids);
  }

  createSession(
    input: NewSessionInput,
  ): Effect.Effect<StoredSession, StorageError> {
    return this.driver.createSession(input);
  }

  getSession(
    id: number,
  ): Effect.Effect<Option.Option<StoredSession>, StorageError> {
    return this.driver.getSession(id);
  }

  listSessions(userId: number): Effect.Effect<StoredSession[], StorageError> {
    return this.driver.listSessions(userId);
  }

  updateSession(
    id: number,
    patch: SessionPatch,
  ): Effect.Effect<void, StorageError> {
    return this.driver.updateSession(id, patch);
  }

  createAnswer(input: NewAnswerInput): Effect.Effect<void, StorageError> {
    return this.driver.createAnswer(input);
  }

  listAnswers(sessionId: number): Effect.Effect<StoredAnswer[], StorageError> {
    return this.driver.listAnswers(sessionId);
  }

  getStats(userId: number): Effect.Effect<StatsResult, StorageError> {
    return this.driver.getStats(userId);
  }
}

export { BaseStorageService };
