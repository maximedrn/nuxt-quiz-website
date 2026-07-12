import type { Effect } from "effect";
import type {
  Database,
  DatabaseError,
} from "@/app/lib/database/database.types.ts";

/**
 * Public database contract. Exposes the Drizzle client and a graceful
 * disconnect. Consumers type against this, never a concrete driver.
 */
interface IDatabaseService {
  /**
   * The Drizzle client, typed against the project schema.
   */
  readonly db: Database;
  /**
   * Closes the underlying connection pool.
   */
  disconnect: () => Effect.Effect<void, DatabaseError>;
}

export type { IDatabaseService };
