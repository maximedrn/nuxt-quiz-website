import { useAuth } from '@/server/lib/auth/auth.context'
import { readAccessToken } from '@/server/lib/auth/auth.http'

/**
 * Populates `event.context.user` from a valid bearer access token.
 *
 * Non-blocking: requests without a (valid) token simply carry no user —
 * protected handlers enforce authentication via `requireUserId`. Runs after the
 * rate-limit middleware (`00.rate-limit`).
 */
export default defineEventHandler(async (event) => {
  const token = readAccessToken(event)
  if (!token) return
  const result = await useAuth().verifyAccess(token)
  if (result.isOk()) {
    event.context.user = { id: result.value.userId }
  }
})
