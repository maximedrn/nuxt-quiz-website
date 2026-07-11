import { requireUserId } from '@/server/lib/auth/auth.http'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { toPlayableQuestion } from '@/server/lib/quiz/quiz.question'
import { getOwnedSessionOrThrow, toSessionSummary } from '@/server/lib/quiz/quiz.session'
import { parseSessionId } from '@/server/lib/quiz/quiz.validation'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { SessionStateResult } from '@/shared/types'

/**
 * Returns the live state of a session: summary, progress, the next unanswered
 * question (answer key stripped), and the correct/incorrect trail so far.
 */
export default defineEventHandler(async (event): Promise<SessionStateResult> => {
  const userId = requireUserId(event)
  const id = parseSessionId(getRouterParam(event, 'id'))
  const storage = await useQuizStorage()

  const session = await getOwnedSessionOrThrow(storage, id, userId)
  const answers = await unwrapOrThrow(storage.listAnswers(id))

  const total = session.questionIds.length
  const answeredCount = answers.length
  const summary = toSessionSummary(session, answeredCount)

  const correctByQuestionId = new Map(answers.map((a) => [a.questionId, a.isCorrect]))
  const answeredResults: Array<'correct' | 'incorrect'> = session.questionIds
    .slice(0, answeredCount)
    .map((qid) => (correctByQuestionId.get(qid) ? 'correct' : 'incorrect'))

  if (session.status === 'completed') {
    return {
      session: summary,
      progress: { current: total, total },
      currentQuestion: null,
      needsFinish: false,
      answeredResults,
    }
  }

  if (answeredCount >= total) {
    return {
      session: summary,
      progress: { current: total, total },
      currentQuestion: null,
      needsFinish: true,
      answeredResults,
    }
  }

  const nextQuestionId = session.questionIds[answeredCount]
  if (nextQuestionId === undefined) {
    throw createError({ statusCode: 500, statusMessage: 'Session question order is corrupted.' })
  }
  const [question] = await unwrapOrThrow(storage.getQuestionsByIds([nextQuestionId]))
  if (!question) {
    throw createError({
      statusCode: 500,
      statusMessage: 'A question referenced by this session no longer exists.',
    })
  }

  return {
    session: summary,
    progress: { current: answeredCount + 1, total },
    currentQuestion: toPlayableQuestion(question),
    needsFinish: false,
    answeredResults,
  }
})
