import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and adjust it first.')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/lib/database/schema/*.schema.ts',
  out: './server/lib/database/migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})
