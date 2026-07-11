import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * A registered player. Identified by a self-chosen 8-digit code that is only
 * ever stored as an argon2 hash (`codeHash`) — the clear code is never
 * persisted and cannot be recovered. See `@/server/lib/auth`.
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  /**
   * Deterministic HMAC of the code (keyed by a server pepper). Indexed and
   * unique so an account can be found by code without ever storing the code —
   * the argon2 `codeHash` is the actual verifier.
   */
  codeLookup: text('code_lookup').notNull().unique(),
  /** Argon2 hash of the 8-digit code. Never reversible, never returned. */
  codeHash: text('code_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
