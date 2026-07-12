import type { H3Event } from "h3";
import { defineEventHandler } from "h3";
import { requireUserId } from "@/app/lib/auth/auth.session.ts";
import type { MeResult } from "@/app/lib/auth/auth.types.ts";

/**
 * Returns the authenticated user's id (throws 401 if no valid session). The
 * client uses this to check whether the session cookie is still valid on load.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<MeResult>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<MeResult> => ({
    userId: await requireUserId(event),
  }),
);

export default handler;
