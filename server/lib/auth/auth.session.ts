import type { H3Event } from 'h3'

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
export async function requireUserId(event: H3Event): Promise<number> {
  const session = await requireUserSession(event)
  return session.user.id
}
