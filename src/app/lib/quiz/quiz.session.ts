import { Effect, Option } from "effect";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { QuizMessage } from "@/app/lib/quiz/quiz.message.ts";
import type { SessionSummary } from "@/app/lib/quiz/quiz.types.ts";
import { QuizError } from "@/app/lib/quiz/quiz.types.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  StorageError,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

/**
 * Loads a session and asserts the caller owns it.
 *
 * Returns a 404 `QuizError` if the session doesn't exist or belongs to another
 * user — ownership failures are reported as 404 (not 403) so session ids can't
 * be probed for existence across accounts.
 *
 * @param {IStorageService} storage - The storage service.
 * @param {number} id - Session id from the route.
 * @param {number} userId - Authenticated user id.
 *
 * @returns {Effect.Effect<StoredSession, StorageError | QuizError>} The owned
 *   session or an error.
 */
const getOwnedSession: (
  storage: IStorageService,
  id: number,
  userId: number,
) => Effect.Effect<StoredSession, StorageError | QuizError> = (
  storage: IStorageService,
  id: number,
  userId: number,
): Effect.Effect<StoredSession, StorageError | QuizError> =>
  storage.getSession(id).pipe(
    Effect.flatMap(
      (
        maybeSession: Option.Option<StoredSession>,
      ): Effect.Effect<StoredSession, StorageError | QuizError> => {
        if (Option.isNone(maybeSession)) {
          return Effect.fail(
            new QuizError({
              message: `${QuizMessage.sessionNotFound}: ${id}`,
              status: HttpStatus.notFound,
            }),
          );
        }
        const session: StoredSession = maybeSession.value;
        if (session.userId !== userId) {
          return Effect.fail(
            new QuizError({
              message: `${QuizMessage.sessionNotFound}: ${id}`,
              status: HttpStatus.notFound,
            }),
          );
        }
        return Effect.succeed(session);
      },
    ),
  );

/**
 * Projects a stored session into the client-facing summary shape.
 *
 * @param {StoredSession} session - The stored session.
 * @param {number} answeredCount - How many questions have been answered.
 *
 * @returns {SessionSummary} The summary DTO.
 */
const toSessionSummary: (
  session: StoredSession,
  answeredCount: number,
) => SessionSummary = (
  session: StoredSession,
  answeredCount: number,
): SessionSummary => {
  let finishedAt: string | null = null;
  if (session.finishedAt !== null) {
    finishedAt = session.finishedAt.toISOString();
  }
  return {
    answered: answeredCount,
    finishedAt,
    id: session.id,
    mode: session.mode,
    score: session.score,
    startedAt: session.startedAt.toISOString(),
    status: session.status,
    total: session.questionIds.length,
  };
};

export { getOwnedSession, toSessionSummary };
