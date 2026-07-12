import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { AuthRules } from "@/app/lib/auth/auth.constants.ts";
import type { IAuthService } from "@/app/lib/auth/auth.interface.ts";
import { AuthMessage } from "@/app/lib/auth/auth.message.ts";
import {
  type AuthConfig,
  type AuthDependencies,
  AuthError,
} from "@/app/lib/auth/auth.types.ts";
import type { Database } from "@/app/lib/database/database.types.ts";
import { users } from "@/app/lib/database/schema/user.schema.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Pure, testable HMAC lookup computation.
 *
 * Extracted so unit tests can verify determinism and pepper-dependency without
 * requiring a database or Nuxt globals.
 *
 * @param {string} code - The 8-digit user code.
 * @param {string} pepper - The server-side pepper secret.
 *
 * @returns {string} The hex-encoded HMAC digest used as the account lookup key.
 */
const computeLookup: (code: string, pepper: string) => string = (
  code: string,
  pepper: string,
): string =>
  createHmac(AuthRules.lookupAlgorithm, pepper).update(code).digest("hex");

/**
 * Concrete auth service backed by `nuxt-auth-utils` scrypt hashing.
 *
 * Security invariants:
 *
 * - `register`: always calls `hashPassword` before checking for a collision, so
 *   timing cannot reveal whether an account exists.
 * - `login` miss: runs a throwaway `hashPassword` to equalize timing with the hit
 *   path, preventing enumeration via response latency.
 * - Lookup key is a peppered HMAC — the code never appears in the database.
 */
class AuthService implements IAuthService {
  readonly #db: Database;
  readonly #config: AuthConfig;

  /**
   * @param {AuthDependencies} deps - Database client and static configuration.
   */
  constructor(deps: AuthDependencies) {
    this.#db = deps.db;
    this.#config = deps.config;
  }

  /**
   * Deterministic, peppered HMAC of a code — the account lookup key.
   */
  private lookup(code: string): string {
    return computeLookup(code, this.#config.lookupPepper);
  }

  /**
   * Registers a new account for the given 8-digit code.
   *
   * Always hashes first (constant-time, no enumeration timing oracle), then
   * checks for a collision. Returns the new user `id` on success.
   *
   * @param {string} code - The 8-digit registration code.
   *
   * @returns {Effect.Effect<{ id: number }, AuthError>}
   */
  register(code: string): Effect.Effect<{ id: number }, AuthError> {
    return Effect.gen(this, function* () {
      // Hash first — constant-time regardless of whether the code is taken.
      const codeHash: string = yield* Effect.tryPromise({
        catch: (error: unknown): AuthError =>
          new AuthError({
            message: String(error),
            status: HttpStatus.internal,
          }),
        try: () => hashPassword(code),
      });

      const codeLookup: string = this.lookup(code);

      const existing: { id: number }[] = yield* Effect.tryPromise({
        catch: (error: unknown): AuthError =>
          new AuthError({
            message: String(error),
            status: HttpStatus.internal,
          }),
        try: () =>
          this.#db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.codeLookup, codeLookup))
            .limit(1),
      });

      if (existing[0]) {
        return yield* Effect.fail(
          new AuthError({
            message: AuthMessage.codeTaken,
            status: HttpStatus.conflict,
          }),
        );
      }

      const inserted: { id: number }[] = yield* Effect.tryPromise({
        catch: (error: unknown): AuthError =>
          new AuthError({
            message: String(error),
            status: HttpStatus.internal,
          }),
        try: () =>
          this.#db
            .insert(users)
            .values({ codeHash, codeLookup })
            .returning({ id: users.id }),
      });

      const row: { id: number } | undefined = inserted[0];
      if (!row) {
        return yield* Effect.fail(
          new AuthError({
            message: AuthMessage.insertReturnedNoRow,
            status: HttpStatus.internal,
          }),
        );
      }

      return { id: row.id };
    });
  }

  /**
   * Authenticates an account by its 8-digit code.
   *
   * On a lookup miss, runs a throwaway `hashPassword` to equalize timing with
   * the hit path, then fails. On a hit, verifies the stored scrypt hash.
   *
   * @param {string} code - The 8-digit login code.
   *
   * @returns {Effect.Effect<{ id: number }, AuthError>}
   */
  login(code: string): Effect.Effect<{ id: number }, AuthError> {
    return Effect.gen(this, function* () {
      const codeLookup: string = this.lookup(code);

      const rows: { id: number; codeHash: string }[] = yield* Effect.tryPromise(
        {
          catch: (error: unknown): AuthError =>
            new AuthError({
              message: String(error),
              status: HttpStatus.internal,
            }),
          try: () =>
            this.#db
              .select({ codeHash: users.codeHash, id: users.id })
              .from(users)
              .where(eq(users.codeLookup, codeLookup))
              .limit(1),
        },
      );

      const user: { id: number; codeHash: string } | undefined = rows[0];

      if (!user) {
        // Equalize timing: a miss must cost roughly the same as a hit.
        yield* Effect.tryPromise({
          catch: (error: unknown): AuthError =>
            new AuthError({
              message: String(error),
              status: HttpStatus.internal,
            }),
          try: () => hashPassword(code),
        });
        return yield* Effect.fail(
          new AuthError({
            message: AuthMessage.invalidCredentials,
            status: HttpStatus.unauthorized,
          }),
        );
      }

      const valid: boolean = yield* Effect.tryPromise({
        catch: (error: unknown): AuthError =>
          new AuthError({
            message: String(error),
            status: HttpStatus.internal,
          }),
        try: () => verifyPassword(user.codeHash, code),
      });

      if (!valid) {
        return yield* Effect.fail(
          new AuthError({
            message: AuthMessage.invalidCredentials,
            status: HttpStatus.unauthorized,
          }),
        );
      }

      return { id: user.id };
    });
  }
}

export { AuthService, computeLookup };
