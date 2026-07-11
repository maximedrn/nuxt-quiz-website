import is from '@sindresorhus/is'
import { useAuth } from '@/server/lib/auth/auth.context'
import { AuthError } from '@/server/lib/auth/auth.error'
import { setRefreshCookie } from '@/server/lib/auth/auth.http'
import type { AuthResult } from '@/shared/types'

/**
 * Registers a new account from a self-chosen 8-digit code and signs the user in.
 *
 * The code is argon2-hashed (never stored in clear). Returns an access token
 * and sets the rotating refresh token as an httpOnly cookie.
 */
export default defineEventHandler(async (event): Promise<AuthResult> => {
  const body = await readBody(event)
  const code = is.plainObject(body) && is.string(body.code) ? body.code : ''

  const result = await useAuth().register(code)
  if (result.isErr()) {
    const statusCode = result.error === AuthError.CODE_TAKEN ? 409 : 400
    throw createError({ statusCode, statusMessage: result.error })
  }

  setRefreshCookie(event, result.value.tokens.refreshToken)
  return {
    accessToken: result.value.tokens.accessToken,
    expiresIn: result.value.tokens.accessExpiresIn,
  }
})
