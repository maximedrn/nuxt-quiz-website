import is from '@sindresorhus/is'
import type { StoredQuestion } from '@/server/lib/storage/storage.types'
import type { PlayableQuestion } from '@/shared/types'

/**
 * Strips `correctAnswer` / `explanation` so a question can be sent to the client
 * mid-session without leaking the answer key.
 *
 * @param {StoredQuestion} q - The stored question.
 *
 * @returns {PlayableQuestion} The client-safe question.
 */
export function toPlayableQuestion(q: StoredQuestion): PlayableQuestion {
  return {
    id: q.id,
    number: q.number,
    title: q.title,
    question: q.question,
    code: q.code,
    options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
  }
}

/**
 * Fisher-Yates shuffle. Returns a new array, doesn't mutate the input.
 *
 * @param {T[]} input - The array to shuffle.
 *
 * @returns {T[]} A new, shuffled array.
 */
export function shuffle<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = arr[i]
    const b = arr[j]
    // Indices are always in-range here; the guard is only to satisfy
    // noUncheckedIndexedAccess without a cast.
    if (!is.undefined(a) && !is.undefined(b)) {
      arr[i] = b
      arr[j] = a
    }
  }
  return arr
}
