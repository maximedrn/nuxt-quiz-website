import type { AuthOperations } from '@/server/lib/auth/auth.types'

/**
 * Public auth contract: registration and login by 8-digit code.
 * Consumers type against this interface, never against a concrete class.
 */
interface IAuthService extends AuthOperations {}

export type { IAuthService }
