import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { Data } from 'effect'
import type { databaseSchema } from '@/server/lib/database/database.schema'
import type { HttpStatus } from '@/server/lib/http/http.status'

/** Tagged error for database domain failures. */
export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

/** Config to open a database connection. */
export interface DatabaseConfig {
  readonly url: string
}

/** The project's Drizzle client, typed against the aggregated schema. */
export type Database = PostgresJsDatabase<typeof databaseSchema>
