import is from '@sindresorhus/is'
import { useAuth } from '@/server/lib/auth/auth.context'
import { clearRefreshCookie, readRefreshToken } from '@/server/lib/auth/auth.http'

/**
 * Logs out: revokes the current refresh token and clears its cookie.
 * Idempotent — revoking an absent token is a success.
 */
export default defineEventHandler(async (event): Promise<{ ok: true }> => {
  const token = readRefreshToken(event)
  if (is.nonEmptyString(token)) {
    await useAuth().logout(token)
  }
  clearRefreshCookie(event)
  return { ok: true }
})
