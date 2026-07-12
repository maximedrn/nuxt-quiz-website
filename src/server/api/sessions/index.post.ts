import { Effect } from "effect";
import { shuffle } from "fast-shuffle";
import type { H3Event } from "h3";
import { match } from "ts-pattern";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { QuizMessage } from "@/app/lib/quiz/quiz.message.ts";
import type { CreateSessionResult } from "@/app/lib/quiz/quiz.types.ts";
import { QuizError } from "@/app/lib/quiz/quiz.types.ts";
import {
  createSessionSchema,
  decodeOr400,
} from "@/app/lib/quiz/quiz.validation.ts";
import type { SessionMode } from "@/app/lib/storage/storage.constants.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  QuestionRef,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

const handler: EventHandler<
  EventHandlerRequest,
  Promise<CreateSessionResult>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<CreateSessionResult> => {
    const userId: number = await requireUserId(event);
    const body: unknown = await readBody(event);
    const storage: IStorageService = await useQuizStorage();
    return runOrThrow(
      Effect.gen(function* () {
        const input: { mode: SessionMode; quizId: number; size: number } =
          yield* decodeOr400(createSessionSchema, body);
        const refs: QuestionRef[] = yield* storage.listQuestionRefs(
          input.quizId,
        );
        if (refs.length === 0) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.noQuestions,
              status: HttpStatus.internal,
            }),
          );
        }
        if (input.size > refs.length) {
          return yield* Effect.fail(
            new QuizError({
              message: `${QuizMessage.sizeRange}: 1..${refs.length}`,
              status: HttpStatus.badRequest,
            }),
          );
        }
        const ordered: QuestionRef[] = match(input.mode)
          .with("sequential", () =>
            [...refs].sort(
              (a: QuestionRef, b: QuestionRef) => a.number - b.number,
            ),
          )
          .with("random", () => shuffle(refs))
          .exhaustive();
        const questionIds: number[] = ordered
          .slice(0, input.size)
          .map((ref: QuestionRef) => ref.id);
        const session: StoredSession = yield* storage.createSession({
          mode: input.mode,
          questionIds,
          quizId: input.quizId,
          userId,
        });
        return { id: session.id };
      }),
    );
  },
);

export default handler;
