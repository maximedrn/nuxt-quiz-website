import { ResultAsync } from 'neverthrow'
import { FetchError } from 'ofetch'
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

/** The subset of `$fetch` options the quiz API uses. */
interface ApiOptions {
  method?: 'GET' | 'POST'
  body?: object
  headers?: Record<string, string>
}

/** Thin, fully-typed wrapper around the quiz API with bearer auth + 401 retry. */
export function useApi() {
  const { accessToken, refresh } = useAuth()

  /** Builds request options with the current access token attached. */
  const withAuth = (opts?: ApiOptions): ApiOptions => ({
    ...opts,
    headers: {
      ...(opts?.headers ?? {}),
      ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
    },
  })

  /**
   * Fetches with the access token; on a 401 it refreshes once and retries.
   *
   * @param {string} url - Endpoint path.
   * @param {ApiOptions} opts - `$fetch` options.
   *
   * @returns {Promise<T>} The typed response.
   */
  const apiFetch = async <T>(url: string, opts?: ApiOptions): Promise<T> => {
    const attempt = () => ResultAsync.fromPromise($fetch<T>(url, withAuth(opts)), (error) => error)

    const first = await attempt()
    if (first.isOk()) return first.value

    const status = first.error instanceof FetchError ? first.error.statusCode : undefined
    if (status === 401 && (await refresh())) {
      const retry = await attempt()
      if (retry.isOk()) return retry.value
      throw retry.error
    }
    throw first.error
  }

  return {
    createSession: (input: CreateSessionInput) =>
      apiFetch<CreateSessionResult>('/api/sessions', { method: 'POST', body: input }),
    getSessionState: (id: number) => apiFetch<SessionStateResult>(`/api/sessions/${id}`),
    submitAnswer: (id: number, input: SubmitAnswerInput) =>
      apiFetch<SubmitAnswerResult>(`/api/sessions/${id}/answer`, { method: 'POST', body: input }),
    finishSession: (id: number) =>
      apiFetch<FinishSessionResult>(`/api/sessions/${id}/finish`, { method: 'POST' }),
    getSessionResults: (id: number) =>
      apiFetch<SessionResultsResult>(`/api/sessions/${id}/results`),
    listSessions: () => apiFetch<SessionSummary[]>('/api/sessions'),
    getStats: () => apiFetch<StatsResult>('/api/stats'),
    getQuestionCount: () => apiFetch<{ count: number }>('/api/questions/count'),
  }
}
