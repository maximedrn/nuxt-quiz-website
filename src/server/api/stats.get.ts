import { Effect } from "effect";
import type { H3Event } from "h3";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { cachedStats } from "@/app/lib/storage/storage.cache.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type { StatsResult } from "@/app/lib/storage/storage.types.ts";

/**
 * Returns the authenticated user's aggregate stats (accuracy, streak, score
 * trend, weakest questions). Aggregation lives in the storage layer so it works
 * identically across the Postgres and blockchain backends, and is cached.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<StatsResult>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<StatsResult> => {
    const userId: number = await requireUserId(event);
    const storage: IStorageService = await useQuizStorage();
    return runOrThrow(
      Effect.gen(function* () {
        return yield* cachedStats(userId, () => storage.getStats(userId));
      }),
    );
  },
);

export default handler;
