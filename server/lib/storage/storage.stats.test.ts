import { describe, expect, it } from 'vitest'
import { computeStats, computeStreakDays } from '@/server/lib/storage/storage.stats'
import type { StoredAnswer, StoredSession } from '@/server/lib/storage/storage.types'

function session(over: Partial<StoredSession>): StoredSession {
  return {
    id: 1,
    userId: 1,
    questionIds: [1, 2],
    mode: 'random',
    status: 'completed',
    score: 1,
    startedAt: new Date('2026-07-10T10:00:00Z'),
    finishedAt: new Date('2026-07-10T10:05:00Z'),
    ...over,
  }
}

function answer(over: Partial<StoredAnswer>): StoredAnswer {
  return {
    id: 1,
    sessionId: 1,
    questionId: 1,
    selected: 'A',
    isCorrect: true,
    answeredAt: new Date('2026-07-10T10:00:00Z'),
    ...over,
  }
}

const meta = new Map([
  [1, { number: 1, title: 'Q1' }],
  [2, { number: 2, title: 'Q2' }],
])

describe('computeStats', () => {
  /**
   * Accuracy and completed-session counts must reflect only real data — a fresh
   * user with no activity gets zeros and nulls, never a divide-by-zero.
   */
  it('Returns zeros and nulls for a user with no activity.', () => {
    const stats = computeStats({
      totalQuestions: 90,
      sessions: [],
      answers: [],
      questionMeta: meta,
    })
    expect(stats.completedSessions).toBe(0)
    expect(stats.overallAccuracyPct).toBeNull()
    expect(stats.averageScorePct).toBeNull()
    expect(stats.currentStreakDays).toBe(0)
  })

  /**
   * Overall accuracy is correct answers over total answers, rounded — the
   * headline number the dashboard shows must not drift from the raw answers.
   */
  it('Computes overall accuracy from answers.', () => {
    const stats = computeStats({
      totalQuestions: 2,
      sessions: [session({})],
      answers: [answer({ isCorrect: true }), answer({ id: 2, questionId: 2, isCorrect: false })],
      questionMeta: meta,
    })
    expect(stats.overallAccuracyPct).toBe(50)
    expect(stats.totalAnswered).toBe(2)
  })

  /**
   * Weakest questions surface only those actually gotten wrong, ranked by wrong
   * rate — this is what tells a learner where to focus, so a correct-only
   * question must never appear.
   */
  it('Ranks only questions with wrong answers as weakest.', () => {
    const stats = computeStats({
      totalQuestions: 2,
      sessions: [session({})],
      answers: [
        answer({ questionId: 1, isCorrect: true }),
        answer({ id: 2, questionId: 2, isCorrect: false }),
      ],
      questionMeta: meta,
    })
    expect(stats.weakest).toHaveLength(1)
    expect(stats.weakest[0]?.number).toBe(2)
    expect(stats.weakest[0]?.wrongRate).toBe(1)
  })
})

describe('computeStreakDays', () => {
  /**
   * An empty history is a zero-length streak — the guard that stops the streak
   * walk from running against no data.
   */
  it('Returns 0 for no active days.', () => {
    expect(computeStreakDays([])).toBe(0)
  })
})
