import { match } from 'ts-pattern'
import { requireUserId } from '@/server/lib/auth/auth.http'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { shuffle } from '@/server/lib/quiz/quiz.question'
import { createSessionSchema, parseOr400 } from '@/server/lib/quiz/quiz.validation'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { CreateSessionResult } from '@/shared/types'

/**
 * Creates a new training session for the authenticated user.
 *
 * Freezes an ordered set of question ids (sequential by study-guide number, or
 * a random shuffle) so the session stays reproducible even if the bank changes.
 */
export default defineEventHandler(async (event): Promise<CreateSessionResult> => {
  const userId = requireUserId(event)
  const storage = await useQuizStorage()

  const input = parseOr400(createSessionSchema, await readBody(event))

  const refs = await unwrapOrThrow(storage.listQuestionRefs())
  if (refs.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No questions in the database yet — run `bun run db:seed` first.',
    })
  }
  if (input.size > refs.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `size must be between 1 and ${refs.length}`,
    })
  }

  const ordered = match(input.mode)
    .with('sequential', () => [...refs].sort((a, b) => a.number - b.number))
    .with('random', () => shuffle(refs))
    .exhaustive()

  const questionIds = ordered.slice(0, input.size).map((r) => r.id)

  const session = await unwrapOrThrow(
    storage.createSession({ userId, questionIds, mode: input.mode }),
  )
  return { id: session.id }
})
