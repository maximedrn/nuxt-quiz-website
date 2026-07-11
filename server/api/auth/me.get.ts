import { requireUserId } from '@/server/lib/auth/auth.http'
import type { MeResult } from '@/shared/types'

/**
 * Returns the authenticated user's id. The client uses this to check whether a
 * stored/refreshed access token is still valid on load.
 */
export default defineEventHandler((event): MeResult => {
  return { userId: requireUserId(event) }
})
