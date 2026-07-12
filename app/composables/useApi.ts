import type {
  CreateSessionInput,
  CreateSessionResult,
  FinishSessionResult,
  SessionResultsResult,
  SessionStateResult,
  SessionSummary,
  StatsResult,
  SubmitAnswerInput,
  SubmitAnswerResult,
} from '@/shared/types'

/**
 * Thin, fully-typed wrapper around the quiz API.
 *
 * Auth is carried by the session cookie automatically — no bearer header, no
 * refresh logic. `$fetch` rejects on HTTP errors; callers handle via `.catch`.
 *
 * @returns Typed API methods for sessions, answers, stats, and questions.
 */
export function useApi() {
  return {
    /**
     * Creates a new quiz session.
     *
     * @param {CreateSessionInput} input - Session configuration.
     *
     * @returns {Promise<CreateSessionResult>}
     */
    createSession: (input: CreateSessionInput): Promise<CreateSessionResult> =>
      $fetch<CreateSessionResult>('/api/sessions', { method: 'POST', body: input }),

    /**
     * Fetches the current state of a session.
     *
     * @param {number} id - Session ID.
     *
     * @returns {Promise<SessionStateResult>}
     */
    getSessionState: (id: number): Promise<SessionStateResult> =>
      $fetch<SessionStateResult>(`/api/sessions/${id}`),

    /**
     * Submits an answer for the current question in a session.
     *
     * @param {number} id - Session ID.
     * @param {SubmitAnswerInput} input - Selected answer.
     *
     * @returns {Promise<SubmitAnswerResult>}
     */
    submitAnswer: (id: number, input: SubmitAnswerInput): Promise<SubmitAnswerResult> =>
      $fetch<SubmitAnswerResult>(`/api/sessions/${id}/answer`, { method: 'POST', body: input }),

    /**
     * Marks a session as finished.
     *
     * @param {number} id - Session ID.
     *
     * @returns {Promise<FinishSessionResult>}
     */
    finishSession: (id: number): Promise<FinishSessionResult> =>
      $fetch<FinishSessionResult>(`/api/sessions/${id}/finish`, { method: 'POST' }),

    /**
     * Retrieves the scored results of a completed session.
     *
     * @param {number} id - Session ID.
     *
     * @returns {Promise<SessionResultsResult>}
     */
    getSessionResults: (id: number): Promise<SessionResultsResult> =>
      $fetch<SessionResultsResult>(`/api/sessions/${id}/results`),

    /**
     * Lists all sessions for the current user.
     *
     * @returns {Promise<SessionSummary[]>}
     */
    listSessions: (): Promise<SessionSummary[]> => $fetch<SessionSummary[]>('/api/sessions'),

    /**
     * Fetches global quiz statistics.
     *
     * @returns {Promise<StatsResult>}
     */
    getStats: (): Promise<StatsResult> => $fetch<StatsResult>('/api/stats'),

    /**
     * Returns the total number of questions in the bank.
     *
     * @returns {Promise<{ count: number }>}
     */
    getQuestionCount: (): Promise<{ count: number }> =>
      $fetch<{ count: number }>('/api/questions/count'),
  }
}
