import { requireUserId } from '@/server/lib/auth/auth.session'
import type { MeResult } from '@/shared/types'

/**
 * Returns the authenticated user's id (throws 401 if no valid session). The
 * client uses this to check whether the session cookie is still valid on load.
 */
export default defineEventHandler(async (event): Promise<MeResult> => {
  return { userId: await requireUserId(event) }
})
