import is from '@sindresorhus/is'
import type { AuthResult } from '@/shared/types'
import { useAuth } from '@/server/lib/auth/auth.context'
import { AuthMessage } from '@/server/lib/auth/auth.message'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'

const CODE_PATTERN = /^\d{8}$/

/**
 * Registers a new account from a self-chosen 8-digit code and opens a session.
 *
 * The code is scrypt-hashed by nuxt-auth-utils (never stored in clear). On
 * success a sealed session cookie is set.
 */
export default defineEventHandler(async (event): Promise<AuthResult> => {
  const body = await readBody(event)
  const code = is.plainObject(body) && is.string(body.code) ? body.code : ''
  if (!CODE_PATTERN.test(code)) {
    throw createError({ statusCode: HttpStatus.BAD_REQUEST, statusMessage: AuthMessage.INVALID_FORMAT })
  }

  const { id } = await runOrThrow(useAuth().register(code))
  await setUserSession(event, { user: { id } })
  return { userId: id }
})
