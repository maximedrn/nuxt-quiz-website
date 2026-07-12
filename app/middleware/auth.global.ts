/**
 * Global route guard: requires an authenticated session for every page except
 * `/login`.
 *
 * Runs client-side only (session state lives in the cookie). On first load
 * `loggedIn` may be false until `fetch()` reads the cookie from the server;
 * we call it once and redirect if still unauthenticated.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/login') return

  const { loggedIn, fetch } = useUserSession()
  if (!loggedIn.value) await fetch()
  if (!loggedIn.value) return navigateTo('/login')
})
