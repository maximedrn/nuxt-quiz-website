import type { SecurityOperations } from '@/server/lib/security/security.types'

/**
 * Public rate-limit contract. Consumers type against this.
 */
interface IRateLimitService extends SecurityOperations {}

export type { IRateLimitService }
