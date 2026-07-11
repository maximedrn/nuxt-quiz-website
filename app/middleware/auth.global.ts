/**
 * Global route guard: requires an authenticated user for every page except
 * `/login`.
 *
 * Runs client-side only (the access token lives in memory). If there's no token
 * yet, it attempts a silent refresh from the cookie before redirecting to login.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const { isAuthed, refresh } = useAuth()
  if (isAuthed.value) return

  const recovered = await refresh()
  if (!recovered) {
    return navigateTo('/login')
  }
})
