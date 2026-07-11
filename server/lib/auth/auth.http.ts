import is from '@sindresorhus/is'
import type { H3Event } from 'h3'
import { useEnv } from '@/server/lib/env/env.context'

/** Name of the httpOnly cookie carrying the refresh token. */
const REFRESH_COOKIE = 'quiz_refresh'

/** Shape attached to `event.context.user` by the auth middleware. */
interface AuthedUser {
  readonly id: number
}

// Teach h3 that the auth middleware may populate `context.user`, so every
// handler reads it typed — no per-call-site cast.
declare module 'h3' {
  interface H3EventContext {
    user?: AuthedUser
  }
}

/**
 * Returns the authenticated user id, or throws 401.
 *
 * The auth middleware populates `event.context.user` from a valid access token;
 * protected handlers call this to require a signed-in user.
 *
 * @param {H3Event} event - The request event.
 *
 * @returns {number} The authenticated user id.
 */
function requireUserId(event: H3Event): number {
  const user = event.context.user
  if (is.undefined(user)) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required.' })
  }
  return user.id
}

/**
 * Extracts the bearer access token from the Authorization header, if present.
 *
 * @param {H3Event} event - The request event.
 *
 * @returns {string | undefined} The token, or undefined.
 */
function readAccessToken(event: H3Event): string | undefined {
  const header = getRequestHeader(event, 'authorization')
  if (!is.nonEmptyString(header) || !header.startsWith('Bearer ')) return undefined
  return header.slice('Bearer '.length)
}

/** Reads the refresh token from its httpOnly cookie. */
function readRefreshToken(event: H3Event): string | undefined {
  const value = getCookie(event, REFRESH_COOKIE)
  return is.nonEmptyString(value) ? value : undefined
}

/** Writes the refresh token as an httpOnly, same-site cookie. */
function setRefreshCookie(event: H3Event, token: string): void {
  setCookie(event, REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: useEnv().config.refreshTokenTtl,
  })
}

/** Clears the refresh cookie (logout). */
function clearRefreshCookie(event: H3Event): void {
  deleteCookie(event, REFRESH_COOKIE, { path: '/' })
}

export type { AuthedUser }
export { clearRefreshCookie, readAccessToken, readRefreshToken, requireUserId, setRefreshCookie }
