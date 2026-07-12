import is from '@sindresorhus/is'
import type { AuthResult } from '@/shared/types'
import { useAuth } from '@/server/lib/auth/auth.context'
import { AuthMessage } from '@/server/lib/auth/auth.message'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'

const CODE_PATTERN = /^\d{8}$/

/**
 * Signs in with an existing 8-digit code and opens a session.
 *
 * A wrong or unknown code returns a single 401 (constant-time) so accounts
 * can't be enumerated; a malformed code returns 400.
 */
export default defineEventHandler(async (event): Promise<AuthResult> => {
  const body = await readBody(event)
  const code = is.plainObject(body) && is.string(body.code) ? body.code : ''
  if (!CODE_PATTERN.test(code)) {
    throw createError({ statusCode: HttpStatus.BAD_REQUEST, statusMessage: AuthMessage.INVALID_FORMAT })
  }

  const { id } = await runOrThrow(useAuth().login(code))
  await setUserSession(event, { user: { id } })
  return { userId: id }
})
