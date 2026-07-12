import { navigateTo } from "nuxt/app";
import { ApiEndpoint } from "@/app/lib/api/api.constants.ts";

/**
 * Client-side auth state and flows returned by {@link useAuth}.
 */
interface AuthApi {
  isAuthed: { readonly value: boolean };
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (code: string) => Promise<void>;
  user: ReturnType<typeof useUserSession>["user"];
}

/**
 * Client-side auth state and flows, backed by `nuxt-auth-utils` sealed
 * sessions.
 *
 * The session cookie is set/cleared server-side automatically.
 * `useUserSession()` is the source of truth for `loggedIn` / `user`. Callers
 * handle errors via `.catch` on the returned promise.
 *
 * @returns Reactive `isAuthed`/`user` and register/login/logout flows.
 */
const useAuth: () => AuthApi = (): AuthApi => {
  const session: ReturnType<typeof useUserSession> = useUserSession();

  const isAuthed: typeof session.loggedIn = session.loggedIn;

  /**
   * Registers a new account with `code` and syncs the session from the cookie.
   *
   * @param {string} code - 8-digit registration code.
   *
   * @returns {Promise<void>} Resolves on success; rejects with `FetchError` on
   *   failure.
   */
  const register: (code: string) => Promise<void> = async (
    code: string,
  ): Promise<void> => {
    await $fetch(ApiEndpoint.authRegister, { body: { code }, method: "POST" });
    await session.fetch();
  };

  /**
   * Logs in with `code` and syncs the session from the cookie.
   *
   * @param {string} code - 8-digit login code.
   *
   * @returns {Promise<void>} Resolves on success; rejects with `FetchError` on
   *   failure.
   */
  const login: (code: string) => Promise<void> = async (
    code: string,
  ): Promise<void> => {
    await $fetch(ApiEndpoint.authLogin, { body: { code }, method: "POST" });
    await session.fetch();
  };

  /**
   * Logs out by clearing the server session cookie, resetting client state,
   * then redirecting to `/login`.
   *
   * @returns {Promise<void>}
   */
  const logout: () => Promise<void> = async (): Promise<void> => {
    await $fetch(ApiEndpoint.authLogout, { method: "POST" });
    await session.clear();
    await navigateTo("/login");
  };

  return { isAuthed, login, logout, register, user: session.user };
};

export type { AuthApi };
export { useAuth };
