import { defineEventHandler, type H3Event } from "h3";
import { closeSession } from "@/app/lib/auth/auth.session.ts";

/**
 * Logs out by clearing the sealed session cookie. Idempotent.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<{ ok: true }>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<{ ok: true }> => {
    await closeSession(event);
    return { ok: true };
  },
);

export default handler;
