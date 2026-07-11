import type { SecurityOperations } from '@/server/lib/security/security.types'

/**
 * Low-level rate-limit backend contract. Interchangeable backends implement it
 * (Redis-backed rate-limiter-flexible, and an in-memory one for tests).
 */
interface IRateLimitDriver extends SecurityOperations {}

export type { IRateLimitDriver }
