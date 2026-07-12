import { Effect, Schema } from "effect";
import type { H3Event } from "h3";
import { getQuery } from "h3";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { decodeOr400 } from "@/app/lib/quiz/quiz.validation.ts";
import { cachedQuestionCount } from "@/app/lib/storage/storage.cache.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type { StorageError } from "@/app/lib/storage/storage.types.ts";

const handler: EventHandler<
  EventHandlerRequest,
  Promise<{ count: number }>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<{ count: number }> => {
    const query: Record<string, string | string[]> = getQuery(event);
    const storage: IStorageService = await useQuizStorage();
    return runOrThrow(
      Effect.gen(function* () {
        const quizId: number = yield* decodeOr400(
          Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
          query.quizId,
        );
        const count: number = yield* cachedQuestionCount(
          quizId,
          (): Effect.Effect<number, StorageError> =>
            storage.countQuestions(quizId),
        );
        return { count };
      }),
    );
  },
);

export default handler;
