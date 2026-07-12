import type { SecurityOperations } from "@/app/lib/security/security.types.ts";

/**
 * Public rate-limit contract. Consumers type against this.
 */
interface IRateLimitService extends SecurityOperations {}

export type { IRateLimitService };
