import { Effect } from "effect";
import type { H3Event } from "h3";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { toSessionSummary } from "@/app/lib/quiz/quiz.session.ts";
import type { SessionSummary } from "@/app/lib/quiz/quiz.types.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  StoredAnswer,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

/**
 * Lists the authenticated user's sessions, newest first, each with its
 * answered-question count.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<SessionSummary[]>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<SessionSummary[]> => {
    const userId: number = await requireUserId(event);
    const storage: IStorageService = await useQuizStorage();
    return runOrThrow(
      Effect.gen(function* () {
        const sessions: StoredSession[] = yield* storage.listSessions(userId);
        const summaries: SessionSummary[] = [];
        for (const session of sessions) {
          const answers: StoredAnswer[] = yield* storage.listAnswers(
            session.id,
          );
          summaries.push(toSessionSummary(session, answers.length));
        }
        return summaries;
      }),
    );
  },
);

export default handler;
