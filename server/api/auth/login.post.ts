import is from '@sindresorhus/is'
import { useAuth } from '@/server/lib/auth/auth.context'
import { setRefreshCookie } from '@/server/lib/auth/auth.http'
import type { AuthResult } from '@/shared/types'

/**
 * Signs in with an existing 8-digit code.
 *
 * Any failure (unknown or wrong code) returns a single 401 so accounts can't be
 * enumerated. Sets a fresh rotating refresh cookie on success.
 */
export default defineEventHandler(async (event): Promise<AuthResult> => {
  const body = await readBody(event)
  const code = is.plainObject(body) && is.string(body.code) ? body.code : ''

  const result = await useAuth().login(code)
  if (result.isErr()) {
    throw createError({ statusCode: 401, statusMessage: result.error })
  }

  setRefreshCookie(event, result.value.tokens.refreshToken)
  return {
    accessToken: result.value.tokens.accessToken,
    expiresIn: result.value.tokens.accessExpiresIn,
  }
})
