import { describe, expect, it } from "vitest";
import {
  SessionMode,
  SessionStatus,
} from "@/app/lib/storage/storage.constants.ts";
import {
  computeStats,
  computeStreakDays,
} from "@/app/lib/storage/storage.stats.ts";
import type {
  StatsResult,
  StoredAnswer,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

const session: (over: Partial<StoredSession>) => StoredSession = (
  over: Partial<StoredSession>,
): StoredSession => ({
  finishedAt: new Date("2026-07-10T10:05:00Z"),
  id: 1,
  mode: SessionMode.random,
  questionIds: [1, 2],
  score: 1,
  startedAt: new Date("2026-07-10T10:00:00Z"),
  status: SessionStatus.completed,
  userId: 1,
  ...over,
});

const answer: (over: Partial<StoredAnswer>) => StoredAnswer = (
  over: Partial<StoredAnswer>,
): StoredAnswer => ({
  answeredAt: new Date("2026-07-10T10:00:00Z"),
  id: 1,
  isCorrect: true,
  questionId: 1,
  selectedIndex: 0,
  sessionId: 1,
  ...over,
});

const meta: Map<number, { number: number; title: string }> = new Map([
  [1, { number: 1, title: "Q1" }],
  [2, { number: 2, title: "Q2" }],
]);

describe("computeStats", () => {
  /**
   * Accuracy and completed-session counts must reflect only real data — a fresh
   * user with no activity gets zeros and nulls, never a divide-by-zero.
   */
  it("Returns zeros and nulls for a user with no activity.", () => {
    const stats: StatsResult = computeStats({
      answers: [],
      questionMeta: meta,
      sessions: [],
      totalQuestions: 90,
    });
    expect(stats.completedSessions).toBe(0);
    expect(stats.overallAccuracyPercentage).toBeNull();
    expect(stats.averageScorePercentage).toBeNull();
    expect(stats.currentStreakDays).toBe(0);
  });

  /**
   * Overall accuracy is correct answers over total answers, rounded — the
   * headline number the dashboard shows must not drift from the raw answers.
   */
  it("Computes overall accuracy from answers.", () => {
    const stats: StatsResult = computeStats({
      answers: [
        answer({ isCorrect: true }),
        answer({ id: 2, isCorrect: false, questionId: 2 }),
      ],
      questionMeta: meta,
      sessions: [session({})],
      totalQuestions: 2,
    });
    expect(stats.overallAccuracyPercentage).toBe(50);
    expect(stats.totalAnswered).toBe(2);
  });

  /**
   * Weakest questions surface only those actually gotten wrong, ranked by wrong
   * rate — this is what tells a learner where to focus, so a correct-only
   * question must never appear.
   */
  it("Ranks only questions with wrong answers as weakest.", () => {
    const stats: StatsResult = computeStats({
      answers: [
        answer({ isCorrect: true, questionId: 1 }),
        answer({ id: 2, isCorrect: false, questionId: 2 }),
      ],
      questionMeta: meta,
      sessions: [session({})],
      totalQuestions: 2,
    });
    expect(stats.weakest).toHaveLength(1);
    expect(stats.weakest[0]?.number).toBe(2);
    expect(stats.weakest[0]?.wrongRate).toBe(1);
  });
});

describe("computeStreakDays", () => {
  /**
   * An empty history is a zero-length streak — the guard that stops the streak
   * walk from running against no data.
   */
  it("Returns 0 for no active days.", () => {
    expect(computeStreakDays([])).toBe(0);
  });
});
