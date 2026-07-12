import is from "@sindresorhus/is";
import {
  SessionStatus,
  StorageLimits,
} from "@/app/lib/storage/storage.constants.ts";
import type {
  StatsResult,
  StoredAnswer,
  StoredSession,
  TrendPoint,
  WeakQuestion,
} from "@/app/lib/storage/storage.types.ts";

/**
 * Everything `computeStats` needs, already scoped to a single user.
 */
interface StatsSource {
  readonly answers: readonly StoredAnswer[];
  readonly questionMeta: ReadonlyMap<number, { number: number; title: string }>;
  readonly sessions: readonly StoredSession[];
  readonly totalQuestions: number;
}

const ONE_DAY_MS: number = 24 * 60 * 60 * 1000;

/**
 * Counts consecutive days (ending today, or yesterday if today is idle) that
 * have at least one answer — the "current streak".
 *
 * @param {readonly string[]} dayStrings - Distinct `YYYY-MM-DD` UTC day
 *   strings.
 *
 * @returns {number} Length of the active streak in days.
 */
const computeStreakDays: (dayStrings: readonly string[]) => number = (
  dayStrings: readonly string[],
): number => {
  if (dayStrings.length === 0) {
    return 0;
  }
  const daySet: Set<number> = new Set(
    dayStrings.map((day: string) => new Date(`${day}T00:00:00Z`).getTime()),
  );
  const today: Date = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let cursor: number = today.getTime();
  // No activity yet today — the streak may still be alive as of yesterday.
  if (!daySet.has(cursor)) {
    cursor -= ONE_DAY_MS;
  }

  let streak = 0;
  while (daySet.has(cursor)) {
    streak += 1;
    cursor -= ONE_DAY_MS;
  }
  return streak;
};

/**
 * Rounds a session's score to a whole-percentage, or null if it can't be
 * scored.
 */
const sessionPercentage: (session: StoredSession) => number | null = (
  session: StoredSession,
): number | null => {
  const total: number = session.questionIds.length;
  if (total === 0 || is.null(session.score)) {
    return null;
  }
  return (session.score / total) * 100;
};

/**
 * Derives the full stats dashboard from a user's raw sessions and answers.
 *
 * Pure and backend-agnostic: the Postgres and blockchain drivers both fetch raw
 * rows and pipe them through here, so the two backends can never disagree on
 * how a streak, trend or weak-question rate is computed.
 *
 * @param {StatsSource} source - User-scoped sessions, answers and question
 *   meta.
 *
 * @returns {StatsResult} The computed dashboard.
 */
const computeStats: (source: StatsSource) => StatsResult = (
  source: StatsSource,
): StatsResult => {
  const completed: readonly StoredSession[] = source.sessions.filter(
    (session) => session.status === SessionStatus.completed,
  );

  const percentages: number[] = completed
    .map(sessionPercentage)
    .filter((p): p is number => p !== null);
  let averageScorePercentage: number | null = null;
  if (percentages.length > 0) {
    averageScorePercentage = Math.round(
      percentages.reduce((a, b) => a + b, 0) / percentages.length,
    );
  }
  let bestScorePercentage: number | null = null;
  if (percentages.length > 0) {
    bestScorePercentage = Math.round(Math.max(...percentages));
  }

  const totalAnswered: number = source.answers.length;
  const correct: number = source.answers.filter((a) => a.isCorrect).length;
  let overallAccuracyPercentage: number | null = null;
  if (totalAnswered > 0) {
    overallAccuracyPercentage = Math.round((correct / totalAnswered) * 100);
  }

  const dayStrings: string[] = [
    ...new Set(
      source.answers.map((answer: StoredAnswer) =>
        answer.answeredAt.toISOString().slice(0, 10),
      ),
    ),
  ];

  const finished: Array<StoredSession & { finishedAt: Date }> =
    completed.filter(
      (
        session: StoredSession,
      ): session is StoredSession & { finishedAt: Date } =>
        !is.null(session.finishedAt),
    );
  const trend: TrendPoint[] = finished
    .sort(
      (
        a: StoredSession & { finishedAt: Date },
        b: StoredSession & { finishedAt: Date },
      ) => b.finishedAt.getTime() - a.finishedAt.getTime(),
    )
    .slice(0, StorageLimits.trend)
    .map((session: StoredSession & { finishedAt: Date }) => ({
      finishedAt: session.finishedAt.toISOString(),
      percentage: Math.round(sessionPercentage(session) ?? 0),
      sessionId: session.id,
    }))
    .reverse();

  const perQuestion: Map<number, { attempts: number; wrong: number }> = new Map<
    number,
    { attempts: number; wrong: number }
  >();
  for (const answer of source.answers) {
    const entry: { attempts: number; wrong: number } = perQuestion.get(
      answer.questionId,
    ) ?? {
      attempts: 0,
      wrong: 0,
    };
    entry.attempts += 1;
    if (!answer.isCorrect) {
      entry.wrong += 1;
    }
    perQuestion.set(answer.questionId, entry);
  }

  const weakest: WeakQuestion[] = [...perQuestion.entries()]
    .filter(
      ([, value]: [number, { attempts: number; wrong: number }]) =>
        value.wrong > 0,
    )
    .map(
      ([questionId, value]: [number, { attempts: number; wrong: number }]) => {
        const meta: { number: number; title: string } | undefined =
          source.questionMeta.get(questionId);
        let number = 0;
        let title = `Question ${questionId}`;
        if (!is.undefined(meta)) {
          ({ number, title } = meta);
        }
        return {
          attempts: value.attempts,
          number,
          title,
          wrongCount: value.wrong,
          wrongRate: value.wrong / value.attempts,
        };
      },
    )
    .sort(
      (a: WeakQuestion, b: WeakQuestion) =>
        b.wrongRate - a.wrongRate || b.wrongCount - a.wrongCount,
    )
    .slice(0, StorageLimits.weakest);

  return {
    averageScorePercentage,
    bestScorePercentage,
    completedSessions: completed.length,
    currentStreakDays: computeStreakDays(dayStrings),
    overallAccuracyPercentage,
    totalAnswered,
    totalQuestions: source.totalQuestions,
    trend,
    weakest,
  };
};

export { computeStats, computeStreakDays, type StatsSource };
