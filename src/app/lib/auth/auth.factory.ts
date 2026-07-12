import type { IAuthService } from "@/app/lib/auth/auth.interface.ts";
import { AuthService } from "@/app/lib/auth/auth.service.ts";
import type { AuthDependencies } from "@/app/lib/auth/auth.types.ts";

/**
 * Builds the auth credential service.
 *
 * The single entry point for auth construction. Construction can't fail, so it
 * returns the service directly (no Effect).
 *
 * @param {AuthDependencies} deps - Shared database client + static config.
 *
 * @returns {IAuthService} The credential service.
 */
const createAuth: (deps: AuthDependencies) => IAuthService = (
  deps: AuthDependencies,
): IAuthService => new AuthService(deps);

export { createAuth };
