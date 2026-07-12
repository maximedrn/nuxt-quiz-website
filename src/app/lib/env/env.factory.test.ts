import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { createEnv } from "@/app/lib/env/env.factory.ts";
import type { IEnvService } from "@/app/lib/env/env.interface.ts";
import type { EnvError } from "@/app/lib/env/env.types.ts";

/**
 * Minimal valid source: DB connection fields + a 32-char lookup pepper.
 */
const base = {
  authLookupPepper: "b".repeat(32),
  databaseHost: "localhost",
  databaseName: "quiz",
  databasePassword: "quiz",
  databaseUser: "quiz",
} as const satisfies Record<string, string>;

describe("createEnv.", () => {
  /**
   * Absent optionals fall back to documented defaults so the app boots from DB.
   */
  it("Applies defaults for absent optionals.", async () => {
    const service: IEnvService = await Effect.runPromise(createEnv(base));
    expect(service.config.rateLimitPoints).toBe(100);
    expect(service.config.databasePort).toBe(5432);
  });

  /**
   * Numeric env vars arrive as strings from runtimeConfig;
   * `Schema.NumberFromString` must coerce them so downstream arithmetic is not
   * silently broken.
   */
  it("Coerces string numeric variables to numbers.", async () => {
    const service: IEnvService = await Effect.runPromise(
      createEnv({ ...base, rateLimitPoints: "250" }),
    );
    expect(service.config.rateLimitPoints).toBe(250);
  });

  /**
   * Missing DB host must be rejected — no db connection = fatal boot failure.
   */
  it("Rejects a missing databaseHost.", async () => {
    const { databaseHost: _omitted, ...rest } = base;
    const exit: Exit.Exit<IEnvService, EnvError> = await Effect.runPromiseExit(
      createEnv(rest),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });

  /**
   * The dedicated lookup pepper is required and must be at least 32 chars.
   */
  it("Rejects a missing lookup pepper.", async () => {
    const { authLookupPepper: _omitted, ...rest } = base;
    const exit: Exit.Exit<IEnvService, EnvError> = await Effect.runPromiseExit(
      createEnv(rest),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });

  /**
   * A too-short lookup pepper is rejected.
   */
  it("Rejects a too-short lookup pepper.", async () => {
    const exit: Exit.Exit<IEnvService, EnvError> = await Effect.runPromiseExit(
      createEnv({ ...base, authLookupPepper: "short" }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
