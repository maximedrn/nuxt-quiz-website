import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Data } from "effect";
import type { databaseSchema } from "@/app/lib/database/database.schema.ts";
import type { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Tagged error for database domain failures.
 */
class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
  readonly status: HttpStatus;
}> {}

/**
 * Individual connection parameters to open a database connection.
 */
interface DatabaseConfig {
  readonly host: string;
  readonly name: string;
  readonly password: string;
  readonly port: number;
  readonly user: string;
}

/**
 * The project's Drizzle client, typed against the aggregated schema.
 */
type Database = PostgresJsDatabase<typeof databaseSchema>;

export type { Database, DatabaseConfig };
export { DatabaseError };
