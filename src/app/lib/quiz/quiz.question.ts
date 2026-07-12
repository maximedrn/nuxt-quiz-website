import type { PlayableQuestion } from "@/app/lib/quiz/quiz.types.ts";
import type { StoredQuestion } from "@/app/lib/storage/storage.types.ts";

/**
 * Strips `correctIndex` / `explanation` so a question can be sent to the client
 * mid-session without leaking the answer key. `options` is forwarded verbatim —
 * the order the choices are stored in is the order the player sees.
 *
 * @param {StoredQuestion} question - The stored question.
 *
 * @returns {PlayableQuestion} The client-safe question.
 */
const toPlayableQuestion: (question: StoredQuestion) => PlayableQuestion = (
  question: StoredQuestion,
): PlayableQuestion => ({
  code: question.code,
  id: question.id,
  number: question.number,
  options: question.options,
  question: question.question,
  title: question.title,
});

export { toPlayableQuestion };
