import { drizzle } from 'drizzle-orm/d1'
import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import type * as Schema from './schema'

// Kysely Database interface
// This maps table names to their Drizzle-inferred types
export interface Database {
  users: typeof Schema.users.$inferSelect
  sessions: typeof Schema.sessions.$inferSelect
  healthChecks: typeof Schema.healthChecks.$inferSelect
  healthSessions: typeof Schema.healthSessions.$inferSelect
  healthLogs: typeof Schema.healthLogs.$inferSelect
}

export type AppDb = ReturnType<typeof initDb>

export function initDb(d1: D1Database) {
  // Drizzle client
  const db = drizzle(d1, { schema: Schema });

  // Kysely client
  const kysely = new Kysely<Database>({
    dialect: new D1Dialect({ database: d1 }),
  });

  return { db, kysely };
}
