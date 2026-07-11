import { requireUserId } from '@/server/lib/auth/auth.http'
import { unwrapOrThrow } from '@/server/lib/http/http.result'
import { getOwnedSessionOrThrow, toSessionSummary } from '@/server/lib/quiz/quiz.session'
import { parseSessionId } from '@/server/lib/quiz/quiz.validation'
import { useQuizStorage } from '@/server/lib/storage/storage.context'
import type { ReviewItem, SessionResultsResult } from '@/shared/types'

/**
 * Returns the full post-session review: every question with its options, the
 * correct answer, the user's choice and the explanation. Only for completed
 * sessions.
 */
export default defineEventHandler(async (event): Promise<SessionResultsResult> => {
  const userId = requireUserId(event)
  const id = parseSessionId(getRouterParam(event, 'id'))
  const storage = await useQuizStorage()

  const session = await getOwnedSessionOrThrow(storage, id, userId)
  if (session.status !== 'completed') {
    throw createError({ statusCode: 409, statusMessage: 'This session is not finished yet.' })
  }

  const answers = await unwrapOrThrow(storage.listAnswers(id))
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]))

  const questionRows =
    session.questionIds.length > 0
      ? await unwrapOrThrow(storage.getQuestionsByIds(session.questionIds))
      : []
  const questionById = new Map(questionRows.map((q) => [q.id, q]))

  const items: ReviewItem[] = session.questionIds.map((qid) => {
    const question = questionById.get(qid)
    const answer = answerByQuestionId.get(qid)
    if (!question || !answer) {
      throw createError({
        statusCode: 500,
        statusMessage: `Missing data for question ${qid} in session ${id}.`,
      })
    }
    return {
      number: question.number,
      title: question.title,
      question: question.question,
      code: question.code,
      options: {
        A: question.optionA,
        B: question.optionB,
        C: question.optionC,
        D: question.optionD,
      },
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      selected: answer.selected,
      isCorrect: answer.isCorrect,
    }
  })

  return { session: toSessionSummary(session, answers.length), items }
})
