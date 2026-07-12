import is from "@sindresorhus/is";
import { Effect } from "effect";
import type { H3Event } from "h3";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { AnswerOutcome } from "@/app/lib/quiz/option-state.ts";
import { QuizMessage } from "@/app/lib/quiz/quiz.message.ts";
import { toPlayableQuestion } from "@/app/lib/quiz/quiz.question.ts";
import {
  getOwnedSession,
  toSessionSummary,
} from "@/app/lib/quiz/quiz.session.ts";
import type {
  SessionStateResult,
  SessionSummary,
} from "@/app/lib/quiz/quiz.types.ts";
import { QuizError } from "@/app/lib/quiz/quiz.types.ts";
import { parseSessionId } from "@/app/lib/quiz/quiz.validation.ts";
import { SessionStatus } from "@/app/lib/storage/storage.constants.ts";
import { useQuizStorage } from "@/app/lib/storage/storage.context.ts";
import type { IStorageService } from "@/app/lib/storage/storage.interface.ts";
import type {
  StoredAnswer,
  StoredQuestion,
  StoredSession,
} from "@/app/lib/storage/storage.types.ts";

/**
 * Returns the live state of a session: summary, progress, the next unanswered
 * question (answer key stripped), and the correct/incorrect trail so far.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<SessionStateResult>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<SessionStateResult> => {
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
        const answers: StoredAnswer[] = yield* storage.listAnswers(id);

        const total: number = session.questionIds.length;
        const answeredCount: number = answers.length;
        const summary: SessionSummary = toSessionSummary(
          session,
          answeredCount,
        );

        const correctByQuestionId: Map<number, boolean> = new Map(
          answers.map((answer: StoredAnswer) => [
            answer.questionId,
            answer.isCorrect,
          ]),
        );
        const answeredResults: AnswerOutcome[] = session.questionIds
          .slice(0, answeredCount)
          .map((qid): AnswerOutcome => {
            if (correctByQuestionId.get(qid)) {
              return AnswerOutcome.correct;
            }
            return AnswerOutcome.incorrect;
          });

        if (session.status === SessionStatus.completed) {
          return {
            answeredResults,
            currentQuestion: null,
            needsFinish: false,
            progress: { current: total, total },
            session: summary,
          };
        }

        if (answeredCount >= total) {
          return {
            answeredResults,
            currentQuestion: null,
            needsFinish: true,
            progress: { current: total, total },
            session: summary,
          };
        }

        const nextQuestionId: number | undefined =
          session.questionIds[answeredCount];
        if (is.undefined(nextQuestionId)) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.questionOrderCorrupted,
              status: HttpStatus.internal,
            }),
          );
        }

        const questionRows: StoredQuestion[] = yield* storage.getQuestionsByIds(
          [nextQuestionId],
        );
        const question: StoredQuestion | undefined = questionRows[0];
        if (!question) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.questionMissing,
              status: HttpStatus.internal,
            }),
          );
        }

        return {
          answeredResults,
          currentQuestion: toPlayableQuestion(question),
          needsFinish: false,
          progress: { current: answeredCount + 1, total },
          session: summary,
        };
      }),
    );
  },
);

export default handler;
