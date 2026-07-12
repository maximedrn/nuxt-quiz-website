import type { Effect } from "effect";
import { Data } from "effect";
import type { Database } from "@/app/lib/database/database.types.ts";
import type { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Tagged error for auth domain failures.
 */
class AuthError extends Data.TaggedError("AuthError")<{
  readonly message: string;
  readonly status: HttpStatus;
}> {}

/**
 * Static configuration for the auth service.
 */
interface AuthConfig {
  readonly lookupPepper: string;
}

/**
 * Collaborators the auth service depends on.
 */
interface AuthDependencies {
  readonly config: AuthConfig;
  readonly db: Database;
}

/**
 * Auth operations — every method returns an `Effect`.
 */
interface AuthOperations {
  login: (code: string) => Effect.Effect<{ id: number }, AuthError>;
  register: (code: string) => Effect.Effect<{ id: number }, AuthError>;
}

interface AuthResult {
  userId: number;
}

interface MeResult {
  userId: number;
}

export {
  type AuthConfig,
  type AuthDependencies,
  AuthError,
  type AuthOperations,
  type AuthResult,
  type MeResult,
};
