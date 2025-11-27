import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './worker/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.jsonc',
    dbName: 'gold_standard_db',
  },
})
