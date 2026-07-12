import type { Effect } from "effect";
import type {
  Database,
  DatabaseError,
} from "@/app/lib/database/database.types.ts";

/**
 * Low-level database backend contract. Interchangeable backends implement it
 * (currently Drizzle over postgres.js).
 */
interface IDatabaseDriver {
  readonly db: Database;
  disconnect: () => Effect.Effect<void, DatabaseError>;
}

export type { IDatabaseDriver };
