import {
  defineNuxtRouteMiddleware,
  navigateTo,
  type RouteMiddleware,
} from "nuxt/app";
import type { RouteLocationNormalizedGeneric } from "vue-router";

/**
 * Global route guard: requires an authenticated session for every page except
 * `/login`.
 *
 * Runs client-side only (session state lives in the cookie). On first load
 * `loggedIn` may be false until `fetch()` reads the cookie from the server; we
 * call it once and redirect if still unauthenticated.
 */
const handler: RouteMiddleware = defineNuxtRouteMiddleware(
  async (to: RouteLocationNormalizedGeneric) => {
    if (import.meta.server) {
      return;
    }
    if (to.path === "/login") {
      return;
    }

    const session: ReturnType<typeof useUserSession> = useUserSession();
    if (!session.loggedIn.value) {
      await session.fetch();
    }
    if (!session.loggedIn.value) {
      return navigateTo("/login");
    }
  },
);

export default handler;
