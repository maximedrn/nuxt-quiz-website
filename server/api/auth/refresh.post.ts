import is from '@sindresorhus/is'
import { useAuth } from '@/server/lib/auth/auth.context'
import { clearRefreshCookie, readRefreshToken, setRefreshCookie } from '@/server/lib/auth/auth.http'
import type { AuthResult } from '@/shared/types'

/**
 * Rotates the refresh token and issues a new access token.
 *
 * The old refresh token is consumed (single-use); a replayed one is rejected
 * and the cookie cleared, forcing a fresh sign-in.
 */
export default defineEventHandler(async (event): Promise<AuthResult> => {
  const token = readRefreshToken(event)
  if (is.undefined(token)) {
    throw createError({ statusCode: 401, statusMessage: 'No refresh token.' })
  }

  const result = await useAuth().refresh(token)
  if (result.isErr()) {
    clearRefreshCookie(event)
    throw createError({ statusCode: 401, statusMessage: result.error })
  }

  setRefreshCookie(event, result.value.refreshToken)
  return { accessToken: result.value.accessToken, expiresIn: result.value.accessExpiresIn }
})
