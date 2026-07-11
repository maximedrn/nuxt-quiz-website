import { requireUserId } from '@/server/lib/auth/auth.http'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { getOwnedSessionOrThrow } from '@/server/lib/quiz/quiz.session'
import { parseOr400, parseSessionId, submitAnswerSchema } from '@/server/lib/quiz/quiz.validation'
import { invalidateStatsCache } from '@/server/lib/storage/storage.cache'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { SubmitAnswerResult } from '@/shared/types'

/**
 * Records the answer to the session's current question.
 *
 * Enforces strict ordering: the submitted `questionId` must be the next
 * unanswered question, can't be re-answered, and the session must still be open.
 * Grades against the stored key and returns the correct answer + explanation.
 */
export default defineEventHandler(async (event): Promise<SubmitAnswerResult> => {
  const userId = requireUserId(event)
  const id = parseSessionId(getRouterParam(event, 'id'))
  const storage = await useQuizStorage()

  const input = parseOr400(submitAnswerSchema, await readBody(event))

  const session = await getOwnedSessionOrThrow(storage, id, userId)
  if (session.status === 'completed') {
    throw createError({ statusCode: 409, statusMessage: 'This session is already completed.' })
  }

  const existingAnswers = await unwrapOrThrow(storage.listAnswers(id))
  const total = session.questionIds.length
  if (existingAnswers.length >= total) {
    throw createError({
      statusCode: 409,
      statusMessage: 'All questions in this session are already answered.',
    })
  }

  const expectedQuestionId = session.questionIds[existingAnswers.length]
  if (input.questionId !== expectedQuestionId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This is not the current question for this session.',
    })
  }
  if (existingAnswers.some((a) => a.questionId === input.questionId)) {
    throw createError({ statusCode: 409, statusMessage: 'This question was already answered.' })
  }

  const [question] = await unwrapOrThrow(storage.getQuestionsByIds([input.questionId]))
  if (!question) {
    throw createError({ statusCode: 404, statusMessage: 'Question not found.' })
  }

  const isCorrect = input.selected === question.correctAnswer
  await unwrapOrThrow(
    storage.createAnswer({
      sessionId: id,
      questionId: input.questionId,
      selected: input.selected,
      isCorrect,
    }),
  )
  await invalidateStatsCache(userId)

  return {
    correct: isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    progress: { current: existingAnswers.length + 1, total },
  }
})
