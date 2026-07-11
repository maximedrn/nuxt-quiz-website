import type { AuthOperations } from '@/server/lib/auth/auth.types'

/**
 * Public auth contract: registration, login, access verification, refresh-token
 * rotation and logout. Consumers type against this.
 */
interface IAuthService extends AuthOperations {}

export type { IAuthService }
