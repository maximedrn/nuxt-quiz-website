import type { Effect, Option } from 'effect'
import type { IStorageDriver } from '@/server/lib/storage/drivers/storage.driver.interface'
import type { IStorageService } from '@/server/lib/storage/storage.interface'
import type {
  NewAnswerInput,
  NewSessionInput,
  QuestionRef,
  SessionPatch,
  StorageError,
  StoredAnswer,
  StoredQuestion,
  StoredSession,
} from '@/server/lib/storage/storage.types'
import type { StatsResult } from '@/shared/types'

/**
 * Common storage-service logic: holds the selected driver and delegates every
 * operation to it. Concrete services extend this and may override individual
 * methods to layer cross-cutting concerns (e.g. caching) on top.
 */
abstract class BaseStorageService implements IStorageService {
  protected readonly driver: IStorageDriver

  /**
   * @param {IStorageDriver} driver - Backend selected by the factory.
   */
  protected constructor(driver: IStorageDriver) {
    this.driver = driver
  }

  listQuestionRefs(): Effect.Effect<QuestionRef[], StorageError> {
    return this.driver.listQuestionRefs()
  }

  countQuestions(): Effect.Effect<number, StorageError> {
    return this.driver.countQuestions()
  }

  getQuestionsByIds(ids: number[]): Effect.Effect<StoredQuestion[], StorageError> {
    return this.driver.getQuestionsByIds(ids)
  }

  createSession(input: NewSessionInput): Effect.Effect<StoredSession, StorageError> {
    return this.driver.createSession(input)
  }

  getSession(id: number): Effect.Effect<Option.Option<StoredSession>, StorageError> {
    return this.driver.getSession(id)
  }

  listSessions(userId: number): Effect.Effect<StoredSession[], StorageError> {
    return this.driver.listSessions(userId)
  }

  updateSession(id: number, patch: SessionPatch): Effect.Effect<void, StorageError> {
    return this.driver.updateSession(id, patch)
  }

  createAnswer(input: NewAnswerInput): Effect.Effect<void, StorageError> {
    return this.driver.createAnswer(input)
  }

  listAnswers(sessionId: number): Effect.Effect<StoredAnswer[], StorageError> {
    return this.driver.listAnswers(sessionId)
  }

  getStats(userId: number): Effect.Effect<StatsResult, StorageError> {
    return this.driver.getStats(userId)
  }
}

export { BaseStorageService }
