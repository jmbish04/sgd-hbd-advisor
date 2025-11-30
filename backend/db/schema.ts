import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(),
  component: text('component').notNull(),
  message: text('message').notNull(),
  traceId: text('traceId'),
  userId: text('userId'),
  sessionId: text('sessionId'),
  requestId: text('requestId'),
  error: text('error'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull(),
});

export const traces = sqliteTable('traces', {
  id: text('id').primaryKey(),
  traceId: text('trace_id').notNull(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  component: text('component').notNull(),
  status: text('status').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  duration: integer('duration'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull(),
});

export const traceEvents = sqliteTable('trace_events', {
  id: integer('id').primaryKey(),
  traceId: text('trace_id').notNull(),
  eventId: text('event_id').notNull(),
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(),
  component: text('component').notNull(),
  action: text('action').notNull(),
  message: text('message').notNull(),
  data: text('data'),
  codeLocation: text('code_location'),
  createdAt: text('created_at').notNull(),
});

export const marketSnapshots = sqliteTable('market_snapshots', {
  id: integer('id').primaryKey(),
  town: text('town').notNull(),
  flat_type: text('flat_type').notNull(),
  price: real('price').notNull(),
  yield_rate: real('yield_rate'),
  created_at: text('created_at').notNull(),
});