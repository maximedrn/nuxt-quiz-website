import { StorageLimits } from '@/server/lib/storage/storage.constants'
import type { StoredAnswer, StoredSession } from '@/server/lib/storage/storage.types'
import type { StatsResult, TrendPoint, WeakQuestion } from '@/shared/types'

/** Everything `computeStats` needs, already scoped to a single user. */
interface StatsSource {
  readonly totalQuestions: number
  readonly sessions: readonly StoredSession[]
  readonly answers: readonly StoredAnswer[]
  readonly questionMeta: ReadonlyMap<number, { number: number; title: string }>
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Counts consecutive days (ending today, or yesterday if today is idle) that
 * have at least one answer — the "current streak".
 *
 * @param {readonly string[]} dayStrings - Distinct `YYYY-MM-DD` UTC day strings.
 *
 * @returns {number} Length of the active streak in days.
 */
function computeStreakDays(dayStrings: readonly string[]): number {
  if (dayStrings.length === 0) return 0
  const daySet = new Set(dayStrings.map((d) => new Date(`${d}T00:00:00Z`).getTime()))
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  let cursor = today.getTime()
  // No activity yet today — the streak may still be alive as of yesterday.
  if (!daySet.has(cursor)) cursor -= ONE_DAY_MS
  let streak = 0
  while (daySet.has(cursor)) {
    streak++
    cursor -= ONE_DAY_MS
  }
  return streak
}

/** Rounds a session's score to a whole-percentage, or null if it can't be scored. */
function sessionPercentage(session: StoredSession): number | null {
  const total = session.questionIds.length
  if (total === 0 || session.score === null) return null
  return (session.score / total) * 100
}

/**
 * Derives the full stats dashboard from a user's raw sessions and answers.
 *
 * Pure and backend-agnostic: the Postgres and blockchain drivers both fetch raw
 * rows and pipe them through here, so the two backends can never disagree on
 * how a streak, trend or weak-question rate is computed.
 *
 * @param {StatsSource} source - User-scoped sessions, answers and question meta.
 *
 * @returns {StatsResult} The computed dashboard.
 *
 * @example
 * ```ts
 * const stats = computeStats({ totalQuestions, sessions, answers, questionMeta })
 * ```
 */
function computeStats(source: StatsSource): StatsResult {
  const completed = source.sessions.filter((s) => s.status === 'completed')

  const pcts = completed.map(sessionPercentage).filter((p): p is number => p !== null)
  const averageScorePct =
    pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null
  const bestScorePct = pcts.length > 0 ? Math.round(Math.max(...pcts)) : null

  const totalAnswered = source.answers.length
  const correct = source.answers.filter((a) => a.isCorrect).length
  const overallAccuracyPct = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : null

  const dayStrings = [
    ...new Set(source.answers.map((a) => a.answeredAt.toISOString().slice(0, 10))),
  ]

  const finished = completed.filter(
    (s): s is StoredSession & { finishedAt: Date } => s.finishedAt !== null,
  )
  const trend: TrendPoint[] = finished
    .sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())
    .slice(0, StorageLimits.TREND)
    .map((s) => ({
      sessionId: s.id,
      finishedAt: s.finishedAt.toISOString(),
      percentage: Math.round(sessionPercentage(s) ?? 0),
    }))
    .reverse()

  const perQuestion = new Map<number, { attempts: number; wrong: number }>()
  for (const answer of source.answers) {
    const entry = perQuestion.get(answer.questionId) ?? { attempts: 0, wrong: 0 }
    entry.attempts++
    if (!answer.isCorrect) entry.wrong++
    perQuestion.set(answer.questionId, entry)
  }

  const weakest: WeakQuestion[] = [...perQuestion.entries()]
    .filter(([, v]) => v.wrong > 0)
    .map(([questionId, v]) => {
      const meta = source.questionMeta.get(questionId)
      return {
        number: meta?.number ?? 0,
        title: meta?.title ?? `Question ${questionId}`,
        attempts: v.attempts,
        wrongCount: v.wrong,
        wrongRate: v.wrong / v.attempts,
      }
    })
    .sort((a, b) => b.wrongRate - a.wrongRate || b.wrongCount - a.wrongCount)
    .slice(0, StorageLimits.WEAKEST)

  return {
    totalQuestions: source.totalQuestions,
    completedSessions: completed.length,
    averageScorePct,
    bestScorePct,
    totalAnswered,
    overallAccuracyPct,
    currentStreakDays: computeStreakDays(dayStrings),
    trend,
    weakest,
  }
}

export type { StatsSource }
export { computeStats, computeStreakDays }
