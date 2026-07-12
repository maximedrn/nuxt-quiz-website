import { Effect } from 'effect'
import { match } from 'ts-pattern'
import { requireUserId } from '@/server/lib/auth/auth.session'
import { runOrThrow } from '@/server/lib/http/http.run'
import { HttpStatus } from '@/server/lib/http/http.status'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { shuffle } from '@/server/lib/quiz/quiz.question'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { createSessionSchema, decodeOr400 } from '@/server/lib/quiz/quiz.validation'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { CreateSessionResult } from '@/shared/types'

/**
 * Creates a new training session for the authenticated user.
 *
 * Freezes an ordered set of question ids (sequential by study-guide number, or
 * a random shuffle) so the session stays reproducible even if the bank changes.
 */
export default defineEventHandler(async (event): Promise<CreateSessionResult> => {
  const userId: number = await requireUserId(event)
  const body: unknown = await readBody(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const input = yield* decodeOr400(createSessionSchema, body)
      const refs = yield* storage.listQuestionRefs()
      if (refs.length === 0)
        return yield* Effect.fail(
          new QuizError({ message: QuizMessage.NO_QUESTIONS, status: HttpStatus.INTERNAL }),
        )
      if (input.size > refs.length)
        return yield* Effect.fail(
          new QuizError({
            message: `${QuizMessage.SIZE_RANGE}: 1..${refs.length}`,
            status: HttpStatus.BAD_REQUEST,
          }),
        )
      const ordered = match(input.mode)
        .with('sequential', () => [...refs].sort((a, b) => a.number - b.number))
        .with('random', () => shuffle(refs))
        .exhaustive()
      const questionIds: number[] = ordered.slice(0, input.size).map((r) => r.id)
      const session = yield* storage.createSession({ userId, questionIds, mode: input.mode })
      return { id: session.id }
    }),
  )
})
