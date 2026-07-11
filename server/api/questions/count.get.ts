import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { cachedQuestionCount } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

/**
 * Returns how many questions are in the bank. Public (no auth) — it's used by
 * the "new session" screen to bound the session-size slider. Cached.
 */
export default defineEventHandler(async (): Promise<{ count: number }> => {
  const storage = await useQuizStorage()
  return { count: await cachedQuestionCount(() => unwrapOrThrow(storage.countQuestions())) }
})
