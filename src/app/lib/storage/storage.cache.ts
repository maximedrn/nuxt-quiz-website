import { Effect } from "effect";
import { CacheKey, CacheTtl } from "@/app/lib/cache/cache.constants.ts";
import { useCache } from "@/app/lib/cache/cache.context.ts";
import { CacheError } from "@/app/lib/cache/cache.types.ts";
import type {
  StatsResult,
  StorageError,
  StoredQuiz,
} from "@/app/lib/storage/storage.types.ts";

const toCacheError: (error: StorageError) => CacheError = (
  error: StorageError,
) => new CacheError({ message: error.message, status: error.status });

const cachedStats: (
  userId: number,
  compute: () => Effect.Effect<StatsResult, StorageError>,
) => Effect.Effect<StatsResult, CacheError> = (
  userId: number,
  compute: () => Effect.Effect<StatsResult, StorageError>,
): Effect.Effect<StatsResult, CacheError> =>
  useCache().getOrSet(CacheKey.stats(userId), CacheTtl.stats, () =>
    compute().pipe(Effect.mapError(toCacheError)),
  );

const invalidateStatsCache: (
  userId: number,
) => Effect.Effect<void, CacheError> = (
  userId: number,
): Effect.Effect<void, CacheError> => useCache().delete(CacheKey.stats(userId));

const cachedQuestionCount: (
  quizId: number,
  compute: () => Effect.Effect<number, StorageError>,
) => Effect.Effect<number, CacheError> = (
  quizId: number,
  compute: () => Effect.Effect<number, StorageError>,
): Effect.Effect<number, CacheError> =>
  useCache().getOrSet(
    CacheKey.questionCount(quizId),
    CacheTtl.questionCount,
    () => compute().pipe(Effect.mapError(toCacheError)),
  );

const cachedQuizList: (
  compute: () => Effect.Effect<StoredQuiz[], StorageError>,
) => Effect.Effect<StoredQuiz[], CacheError> = (
  compute: () => Effect.Effect<StoredQuiz[], StorageError>,
): Effect.Effect<StoredQuiz[], CacheError> =>
  useCache().getOrSet(CacheKey.quizList(), CacheTtl.quizList, () =>
    compute().pipe(Effect.mapError(toCacheError)),
  );

export {
  cachedQuestionCount,
  cachedQuizList,
  cachedStats,
  invalidateStatsCache,
};
