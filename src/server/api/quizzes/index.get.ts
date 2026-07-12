import { Effect } from "effect";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { cachedQuizList } from "@/app/lib/storage/storage.cache.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  StorageError,
  StoredQuiz,
} from "@/app/lib/storage/storage.types.ts";

const handler: EventHandler<
  EventHandlerRequest,
  Promise<StoredQuiz[]>
> = defineEventHandler(async (): Promise<StoredQuiz[]> => {
  const storage: IStorageService = await useQuizStorage();
  return runOrThrow(
    Effect.gen(function* () {
      return yield* cachedQuizList(
        (): Effect.Effect<StoredQuiz[], StorageError> => storage.listQuizzes(),
      );
    }),
  );
});

export default handler;
