import { isNone, unwrapSome } from 'option-t/plain_option'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import type { IStorageService } from '@/server/lib/storage/storage.interface'
import type { StoredSession } from '@/server/lib/storage/storage.types'
import type { SessionSummary } from '@/shared/types'

/**
 * Loads a session and asserts the caller owns it.
 *
 * Throws 404 if the session doesn't exist, or if it belongs to another user —
 * ownership failures are reported as 404 (not 403) so session ids can't be
 * probed for existence across accounts.
 *
 * @param {IStorageService} storage - The storage service.
 * @param {number} id - Session id from the route.
 * @param {number} userId - Authenticated user id.
 *
 * @returns {Promise<StoredSession>} The owned session.
 */
export async function getOwnedSessionOrThrow(
  storage: IStorageService,
  id: number,
  userId: number,
): Promise<StoredSession> {
  const maybeSession = await unwrapOrThrow(storage.getSession(id))
  if (isNone(maybeSession)) {
    throw createError({ statusCode: 404, statusMessage: `Session ${id} not found` })
  }
  const session = unwrapSome(maybeSession)
  if (session.userId !== userId) {
    throw createError({ statusCode: 404, statusMessage: `Session ${id} not found` })
  }
  return session
}

/**
 * Projects a stored session into the client-facing summary shape.
 *
 * @param {StoredSession} session - The stored session.
 * @param {number} answeredCount - How many questions have been answered.
 *
 * @returns {SessionSummary} The summary DTO.
 */
export function toSessionSummary(session: StoredSession, answeredCount: number): SessionSummary {
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
