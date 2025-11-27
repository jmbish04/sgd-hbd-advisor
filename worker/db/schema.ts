import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

// --- Auth Tables ---
export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
})

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
})

// --- Health Monitoring Tables ---
export const healthChecks = sqliteTable('health_checks', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'D1_CONNECT', 'AI_PROVIDER_PING'
  status: text('status', { enum: ['PENDING', 'PASS', 'FAIL'] }).notNull().default('PENDING'),
  description: text('description'),
})

export const healthSessions = sqliteTable('health_sessions', {
  id: integer('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  overallStatus: text('overall_status', { enum: ['PASS', 'FAIL'] }).notNull(),
})

export const healthLogs = sqliteTable('health_logs', {
  sessionId: integer('session_id').notNull().references(() => healthSessions.id),
  checkId: integer('check_id').notNull().references(() => healthChecks.id),
  status: text('status', { enum: ['PASS', 'FAIL'] }).notNull(),
  log: text('log'), // Raw error message
  aiExplanation: text('ai_explanation'), // AI-generated explanation
  aiResolution: text('ai_resolution'), // AI-generated fix
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.checkId] }),
}))
