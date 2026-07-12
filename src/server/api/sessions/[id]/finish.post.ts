import { Effect } from "effect";
import type { H3Event } from "h3";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { QuizMessage } from "@/app/lib/quiz/quiz.message.ts";
import { getOwnedSession } from "@/app/lib/quiz/quiz.session.ts";
import type { FinishSessionResult } from "@/app/lib/quiz/quiz.types.ts";
import { QuizError } from "@/app/lib/quiz/quiz.types.ts";
import { parseSessionId } from "@/app/lib/quiz/quiz.validation.ts";
import { invalidateStatsCache } from "@/app/lib/storage/storage.cache.ts";
import { SessionStatus } from "@/app/lib/storage/storage.constants.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  StoredAnswer,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

/**
 * Finalizes a fully-answered session: computes the score, marks it completed
 * and stamps `finishedAt`. Idempotent once completed.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<FinishSessionResult>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<FinishSessionResult> => {
    const userId: number = await requireUserId(event);
    const storage: IStorageService = await useQuizStorage();

    return runOrThrow(
      Effect.gen(function* () {
        const id: number = yield* parseSessionId(getRouterParam(event, "id"));
        const session: StoredSession = yield* getOwnedSession(
          storage,
          id,
          userId,
        );
        const total: number = session.questionIds.length;

        if (session.status === SessionStatus.completed) {
          return { score: session.score ?? 0, total };
        }

        const answers: StoredAnswer[] = yield* storage.listAnswers(id);
        if (answers.length < total) {
          return yield* Effect.fail(
            new QuizError({
              message: `${QuizMessage.questionNotInSession}: ${answers.length}/${total} answered`,
              status: HttpStatus.conflict,
            }),
          );
        }

        const score: number = answers.filter((a) => a.isCorrect).length;
        yield* storage.updateSession(id, {
          finishedAt: new Date(),
          score,
          status: SessionStatus.completed,
        });
        yield* invalidateStatsCache(userId);

        return { score, total };
      }),
    );
  },
);

export default handler;
