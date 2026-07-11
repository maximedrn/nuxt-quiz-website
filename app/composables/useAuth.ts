import is from '@sindresorhus/is'
import { ResultAsync } from 'neverthrow'
import type { AuthResult } from '@/shared/types'

/**
 * Client-side auth state and flows.
 *
 * The access token is kept in memory (Nuxt `useState`); the refresh token is an
 * httpOnly cookie the browser sends automatically. Flows use neverthrow so
 * callers branch on `isErr()` instead of try/catch.
 *
 * @returns Reactive `accessToken`/`isAuthed` and register/login/refresh/logout.
 */
export function useAuth() {
  const accessToken = useState<string | null>('auth:accessToken', () => null)
  const isAuthed = computed(() => is.nonEmptyString(accessToken.value))

  const submit = (path: string, code: string) =>
    ResultAsync.fromPromise(
      $fetch<AuthResult>(path, { method: 'POST', body: { code } }),
      (error) => error,
    ).map((result) => {
      accessToken.value = result.accessToken
      return result
    })

  const register = (code: string) => submit('/api/auth/register', code)
  const login = (code: string) => submit('/api/auth/login', code)

  /** Attempts a silent refresh from the cookie. Returns whether it succeeded. */
  const refresh = async (): Promise<boolean> => {
    const result = await ResultAsync.fromPromise(
      $fetch<AuthResult>('/api/auth/refresh', { method: 'POST' }),
      (error) => error,
    )
    if (result.isErr()) {
      accessToken.value = null
      return false
    }
    accessToken.value = result.value.accessToken
    return true
  }

  const logout = async (): Promise<void> => {
    await ResultAsync.fromPromise($fetch('/api/auth/logout', { method: 'POST' }), (error) => error)
    accessToken.value = null
    await navigateTo('/login')
  }

  return { accessToken, isAuthed, register, login, refresh, logout }
}
