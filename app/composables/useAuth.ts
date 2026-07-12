/**
 * Client-side auth state and flows, backed by `nuxt-auth-utils` sealed sessions.
 *
 * The session cookie is set/cleared server-side automatically. `useUserSession()`
 * is the source of truth for `loggedIn` / `user`. Callers handle errors via
 * `.catch` on the returned promise.
 *
 * @returns Reactive `isAuthed`/`user` and register/login/logout flows.
 */
export function useAuth() {
  const { loggedIn, user, fetch, clear } = useUserSession()

  const isAuthed: typeof loggedIn = loggedIn

  /**
   * Registers a new account with `code` and syncs the session from the cookie.
   *
   * @param {string} code - 8-digit registration code.
   *
   * @returns {Promise<void>} Resolves on success; rejects with `FetchError` on failure.
   */
  const register = async (code: string): Promise<void> => {
    await $fetch('/api/auth/register', { method: 'POST', body: { code } })
    await fetch()
  }

  /**
   * Logs in with `code` and syncs the session from the cookie.
   *
   * @param {string} code - 8-digit login code.
   *
   * @returns {Promise<void>} Resolves on success; rejects with `FetchError` on failure.
   */
  const login = async (code: string): Promise<void> => {
    await $fetch('/api/auth/login', { method: 'POST', body: { code } })
    await fetch()
  }

  /**
   * Logs out by clearing the server session cookie, resetting client state,
   * then redirecting to `/login`.
   *
   * @returns {Promise<void>}
   */
  const logout = async (): Promise<void> => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/login')
  }

  return { isAuthed, user, register, login, logout }
}
