import type { H3Event } from "h3";
import type { UserSessionRequired } from "#auth-utils";

/**
 * Regex a valid 8-digit login/registration code must match.
 */
const CODE_PATTERN: RegExp = /^\d{8}$/u;

/**
 * Returns the authenticated user id, or throws 401.
 *
 * Thin wrapper over nuxt-auth-utils `requireUserSession` (auto-imported), which
 * validates the sealed session cookie and throws a 401 if absent/invalid.
 *
 * @param {H3Event} event - The request event.
 *
 * @returns {Promise<number>} The authenticated user id.
 */
const requireUserId: (event: H3Event) => Promise<number> = async (
  event: H3Event,
): Promise<number> => {
  const session: UserSessionRequired = await requireUserSession(event);
  return session.user.id;
};

/**
 * Opens an authenticated session for the given user id.
 *
 * Single call-site wrapper so nuxt-auth-utils `setUserSession` (auto-imported)
 * appears only here, not in every route handler.
 *
 * @param {H3Event} event - The request event.
 * @param {number} userId - The authenticated user's id.
 */
const openSession: (event: H3Event, userId: number) => Promise<void> = async (
  event: H3Event,
  userId: number,
): Promise<void> => {
  await setUserSession(event, { user: { id: userId } });
};

/**
 * Clears the current session cookie.
 *
 * Single call-site wrapper so nuxt-auth-utils `clearUserSession`
 * (auto-imported) appears only here.
 *
 * @param {H3Event} event - The request event.
 */
const closeSession: (event: H3Event) => Promise<void> = async (
  event: H3Event,
): Promise<void> => {
  await clearUserSession(event);
};

export { CODE_PATTERN, closeSession, openSession, requireUserId };
