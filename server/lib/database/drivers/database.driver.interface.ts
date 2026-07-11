import type { Effect } from 'effect'
import type { Database, DatabaseError } from '@/server/lib/database/database.types'

/**
 * Low-level database backend contract. Interchangeable backends implement it
 * (currently Drizzle over postgres.js).
 */
export interface IDatabaseDriver {
  readonly db: Database
  disconnect(): Effect.Effect<void, DatabaseError>
}
