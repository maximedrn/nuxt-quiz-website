import { Effect, Option } from 'effect'
import { HttpStatus } from '@/server/lib/http/http.status'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import type { IStorageService } from '@/server/lib/storage/storage.interface'
import type { StorageError, StoredSession } from '@/server/lib/storage/storage.types'
import type { SessionSummary } from '@/shared/types'

/**
 * Loads a session and asserts the caller owns it.
 *
 * Returns a 404 `QuizError` if the session doesn't exist or belongs to another user —
 * ownership failures are reported as 404 (not 403) so session ids can't be probed
 * for existence across accounts.
 *
 * @param {IStorageService} storage - The storage service.
 * @param {number} id - Session id from the route.
 * @param {number} userId - Authenticated user id.
 *
 * @returns {Effect.Effect<StoredSession, StorageError | QuizError>} The owned session or an error.
 *
 * @example
 * ```ts
 * const session = yield* getOwnedSession(storage, id, userId)
 * ```
 */
function getOwnedSession(
  storage: IStorageService,
  id: number,
  userId: number,
): Effect.Effect<StoredSession, StorageError | QuizError> {
  return storage.getSession(id).pipe(
    Effect.flatMap((maybeSession) => {
      if (Option.isNone(maybeSession)) {
        return Effect.fail(
          new QuizError({
            message: `${QuizMessage.SESSION_NOT_FOUND}: ${id}`,
            status: HttpStatus.NOT_FOUND,
          }),
        )
      }
      const session = maybeSession.value
      if (session.userId !== userId) {
        return Effect.fail(
          new QuizError({
            message: `${QuizMessage.SESSION_NOT_FOUND}: ${id}`,
            status: HttpStatus.NOT_FOUND,
          }),
        )
      }
      return Effect.succeed(session)
    }),
  )
}

/**
 * Projects a stored session into the client-facing summary shape.
 *
 * @param {StoredSession} session - The stored session.
 * @param {number} answeredCount - How many questions have been answered.
 *
 * @returns {SessionSummary} The summary DTO.
 */
function toSessionSummary(session: StoredSession, answeredCount: number): SessionSummary {
  return {
    id: session.id,
    mode: session.mode,
    status: session.status,
    total: session.questionIds.length,
    answered: answeredCount,
    score: session.score,
    startedAt: session.startedAt.toISOString(),
    finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
  }
}

export { getOwnedSession, toSessionSummary }
