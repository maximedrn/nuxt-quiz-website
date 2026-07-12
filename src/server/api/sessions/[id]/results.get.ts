import { Effect } from "effect";
import type { H3Event } from "h3";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { QuizMessage } from "@/app/lib/quiz/quiz.message.ts";
import {
  getOwnedSession,
  toSessionSummary,
} from "@/app/lib/quiz/quiz.session.ts";
import type {
  ReviewItem,
  SessionResultsResult,
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
 * Returns the full post-session review: every question with its options, the
 * correct answer, the user's choice and the explanation. Only for completed
 * sessions.
 */
const handler: (
  event: H3Event<EventHandlerRequest>,
) => Promise<SessionResultsResult> = defineEventHandler(
  async (
    event: H3Event<EventHandlerRequest>,
  ): Promise<SessionResultsResult> => {
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

        if (session.status !== SessionStatus.completed) {
          return yield* Effect.fail(
            new QuizError({
              message: QuizMessage.alreadyCompleted,
              status: HttpStatus.conflict,
            }),
          );
        }

        const answers: StoredAnswer[] = yield* storage.listAnswers(id);
        const answerByQuestionId: Map<number, StoredAnswer> = new Map(
          answers.map((answer: StoredAnswer) => [answer.questionId, answer]),
        );

        let questionRows: StoredQuestion[] = [];
        if (session.questionIds.length > 0) {
          questionRows = yield* storage.getQuestionsByIds(session.questionIds);
        }
        const questionById: Map<number, StoredQuestion> = new Map(
          questionRows.map((question: StoredQuestion) => [
            question.id,
            question,
          ]),
        );

        const items: ReviewItem[] = [];
        for (const questionId of session.questionIds) {
          const question: StoredQuestion | undefined =
            questionById.get(questionId);
          const answer: StoredAnswer | undefined =
            answerByQuestionId.get(questionId);
          if (!(question && answer)) {
            return yield* Effect.fail(
              new QuizError({
                message: `${QuizMessage.sessionNotFound}: missing data for question ${questionId} in session ${id}`,
                status: HttpStatus.internal,
              }),
            );
          }
          items.push({
            code: question.code,
            correctIndex: question.correctIndex,
            explanation: question.explanation,
            isCorrect: answer.isCorrect,
            number: question.number,
            options: question.options,
            question: question.question,
            selectedIndex: answer.selectedIndex,
            title: question.title,
          });
        }

        return { items, session: toSessionSummary(session, answers.length) };
      }),
    );
  },
);

export default handler;
