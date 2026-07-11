import type { ResultAsync } from 'neverthrow'
import type { Option } from 'option-t/plain_option'
import type { IStorageDriver } from '@/server/lib/storage/drivers/storage.driver.interface'
import type { IStorageService } from '@/server/lib/storage/storage.interface'
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

  listQuestionRefs(): ResultAsync<QuestionRef[], string> {
    return this.driver.listQuestionRefs()
  }

  countQuestions(): ResultAsync<number, string> {
    return this.driver.countQuestions()
  }

  getQuestionsByIds(ids: number[]): ResultAsync<StoredQuestion[], string> {
    return this.driver.getQuestionsByIds(ids)
  }

  createSession(input: NewSessionInput): ResultAsync<StoredSession, string> {
    return this.driver.createSession(input)
  }

  getSession(id: number): ResultAsync<Option<StoredSession>, string> {
    return this.driver.getSession(id)
  }

  listSessions(userId: number): ResultAsync<StoredSession[], string> {
    return this.driver.listSessions(userId)
  }

  updateSession(id: number, patch: SessionPatch): ResultAsync<void, string> {
    return this.driver.updateSession(id, patch)
  }

  createAnswer(input: NewAnswerInput): ResultAsync<void, string> {
    return this.driver.createAnswer(input)
  }

  listAnswers(sessionId: number): ResultAsync<StoredAnswer[], string> {
    return this.driver.listAnswers(sessionId)
  }

  getStats(userId: number): ResultAsync<StatsResult, string> {
    return this.driver.getStats(userId)
  }
}

export { BaseStorageService }
