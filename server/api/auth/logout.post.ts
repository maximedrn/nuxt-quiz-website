/**
 * Logs out by clearing the sealed session cookie. Idempotent.
 */
export default defineEventHandler(async (event): Promise<{ ok: true }> => {
  await clearUserSession(event)
  return { ok: true }
})
