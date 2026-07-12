import { ApiEndpoint } from "@/app/lib/api/api.constants.ts";
import { endpointFor } from "@/app/lib/api/api.service.ts";
import type {
  CreateSessionInput,
  CreateSessionResult,
  FinishSessionResult,
  SessionResultsResult,
  SessionStateResult,
  SessionSummary,
  SubmitAnswerInput,
  SubmitAnswerResult,
} from "@/app/lib/quiz/quiz.types.ts";
import type {
  StatsResult,
  StoredQuiz,
} from "@/app/lib/storage/storage.types.ts";

interface QuizApi {
  createSession: (input: CreateSessionInput) => Promise<CreateSessionResult>;
  finishSession: (id: number) => Promise<FinishSessionResult>;
  getQuestionCount: (quizId: number) => Promise<{ count: number }>;
  getSessionResults: (id: number) => Promise<SessionResultsResult>;
  getSessionState: (id: number) => Promise<SessionStateResult>;
  getStats: () => Promise<StatsResult>;
  listQuizzes: () => Promise<StoredQuiz[]>;
  listSessions: () => Promise<SessionSummary[]>;
  submitAnswer: (
    id: number,
    input: SubmitAnswerInput,
  ) => Promise<SubmitAnswerResult>;
}

const useApi: () => QuizApi = (): QuizApi => {
  const fetch = useRequestFetch();
  return {
    createSession: (input: CreateSessionInput): Promise<CreateSessionResult> =>
      fetch<CreateSessionResult>(ApiEndpoint.sessions, {
        body: input,
        method: "POST",
      }),

    finishSession: (id: number): Promise<FinishSessionResult> =>
      fetch<FinishSessionResult>(endpointFor(ApiEndpoint.sessionFinish, id), {
        method: "POST",
      }),

    getQuestionCount: (quizId: number): Promise<{ count: number }> =>
      fetch<{ count: number }>(
        `${ApiEndpoint.questionsCount}?quizId=${quizId}`,
      ),

    getSessionResults: (id: number): Promise<SessionResultsResult> =>
      fetch<SessionResultsResult>(endpointFor(ApiEndpoint.sessionResults, id)),

    getSessionState: (id: number): Promise<SessionStateResult> =>
      fetch<SessionStateResult>(endpointFor(ApiEndpoint.session, id)),

    getStats: (): Promise<StatsResult> => fetch<StatsResult>(ApiEndpoint.stats),

    listQuizzes: (): Promise<StoredQuiz[]> =>
      fetch<StoredQuiz[]>(ApiEndpoint.quizzes),

    listSessions: (): Promise<SessionSummary[]> =>
      fetch<SessionSummary[]>(ApiEndpoint.sessions),

    submitAnswer: (
      id: number,
      input: SubmitAnswerInput,
    ): Promise<SubmitAnswerResult> =>
      fetch<SubmitAnswerResult>(endpointFor(ApiEndpoint.sessionAnswer, id), {
        body: input,
        method: "POST",
      }),
  };
};

export type { QuizApi };
export { useApi };
