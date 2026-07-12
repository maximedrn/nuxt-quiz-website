import process from "node:process";
import { type Config, defineConfig } from "drizzle-kit";
import { Effect } from "effect";
import { createEnv } from "@/app/lib/env/env.factory.ts";
import type { IEnvService } from "@/app/lib/env/env.interface.ts";

const env: IEnvService = Effect.runSync(createEnv(process.env));

const config: Config = defineConfig({
  dbCredentials: {
    database: env.config.databaseName,
    host: env.config.databaseHost,
    password: env.config.databasePassword,
    port: env.config.databasePort,
    user: env.config.databaseUser,
  },
  dialect: "postgresql",
  out: "./src/app/lib/database/migrations",
  schema: "./src/app/lib/database/schema/*.schema.ts",
  strict: true,
  verbose: true,
});

export default config;
