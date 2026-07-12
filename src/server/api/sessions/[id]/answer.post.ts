import { Effect } from "effect";
import type { H3Event } from "h3";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { QuizMessage } from "@/app/lib/quiz/quiz.message.ts";
import { getOwnedSession } from "@/app/lib/quiz/quiz.session.ts";
import type { SubmitAnswerResult } from "@/app/lib/quiz/quiz.types.ts";
import { QuizError } from "@/app/lib/quiz/quiz.types.ts";
import {
  decodeOr400,
  parseSessionId,
  submitAnswerSchema,
} from "@/app/lib/quiz/quiz.validation.ts";
import { invalidateStatsCache } from "@/app/lib/storage/storage.cache.ts";
import { SessionStatus } from "@/app/lib/storage/storage.constants.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  AnswerIndex,
  StoredAnswer,
  StoredQuestion,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

/**
 * Records the answer to the session's current question.
 *
 * Enforces strict ordering: the submitted `questionId` must be the next
 * unanswered question, can't be re-answered, and the session must still be
 * open. Grades against the stored key and returns the correct answer +
 * explanation.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<SubmitAnswerResult>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<SubmitAnswerResult> => {
    const userId: number = await requireUserId(event);
    const body: unknown = await readBody(event);
    const storage: IStorageService = await useQuizStorage();

    return runOrThrow(
      Effect.gen(function* () {
        const id: number = yield* parseSessionId(getRouterParam(event, "id"));
        const input: { questionId: number; selectedIndex: AnswerIndex } =
          yield* decodeOr400(submitAnswerSchema, body);
        const session: StoredSession = yield* getOwnedSession(
          storage,
          id,
          userId,
        );

        if (session.status === SessionStatus.completed) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.alreadyCompleted,
              status: HttpStatus.conflict,
            }),
          );
        }

        const existingAnswers: StoredAnswer[] = yield* storage.listAnswers(id);
        const total: number = session.questionIds.length;

        if (existingAnswers.length >= total) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.alreadyCompleted,
              status: HttpStatus.conflict,
            }),
          );
        }

        const expectedQuestionId: number | undefined =
          session.questionIds[existingAnswers.length];
        if (input.questionId !== expectedQuestionId) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.questionNotInSession,
              status: HttpStatus.conflict,
            }),
          );
        }

        if (
          existingAnswers.some(
            (answer: StoredAnswer) => answer.questionId === input.questionId,
          )
        ) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.alreadyAnswered,
              status: HttpStatus.conflict,
            }),
          );
        }

        const questionRows: StoredQuestion[] = yield* storage.getQuestionsByIds(
          [input.questionId],
        );
        const question: StoredQuestion | undefined = questionRows[0];
        if (!question) {
          return yield* Effect.fail(
            new QuizError({
              message: `${QuizMessage.sessionNotFound}: ${input.questionId}`,
              status: HttpStatus.notFound,
            }),
          );
        }

        const isCorrect: boolean =
          input.selectedIndex === question.correctIndex;
        yield* storage.createAnswer({
          isCorrect,
          questionId: input.questionId,
          selectedIndex: input.selectedIndex,
          sessionId: id,
        });
        yield* invalidateStatsCache(userId);

        return {
          correct: isCorrect,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          progress: { current: existingAnswers.length + 1, total },
        };
      }),
    );
  },
);

export default handler;
