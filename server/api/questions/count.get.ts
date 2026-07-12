import { Effect } from 'effect'
import { runOrThrow } from '@/server/lib/http/http.run'
import { cachedQuestionCount } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

/**
 * Returns how many questions are in the bank. Public (no auth) — it's used by
 * the "new session" screen to bound the session-size slider. Cached.
 */
export default defineEventHandler(async (): Promise<{ count: number }> => {
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const count = yield* cachedQuestionCount(() => storage.countQuestions())
      return { count }
    }),
  )
})
