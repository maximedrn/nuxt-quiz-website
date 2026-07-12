import { BaseRateLimitService } from "@/app/lib/security/security.base.ts";

/**
 * Concrete rate-limit service. Pure delegation via {@link BaseRateLimitService}.
 */
class RateLimitService extends BaseRateLimitService {}

export { RateLimitService };
