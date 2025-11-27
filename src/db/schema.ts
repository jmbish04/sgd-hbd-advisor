import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const marketSnapshots = sqliteTable('market_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  town: text('town').notNull(),
  flatType: text('flat_type').notNull(),
  price: integer('price').notNull(),
  yieldRate: integer('yield_rate').notNull(),
  createdAt: text('created_at').notNull(),
});

// Comprehensive logging and traceability tables

// Main trace table - tracks each request/operation through the system
export const traces = sqliteTable('traces', {
  id: text('id').primaryKey(), // UUID
  traceId: text('trace_id').notNull(), // For grouping related operations
  parentId: text('parent_id'), // For nested traces
  name: text('name').notNull(), // Operation name (e.g., "chat_request", "workflow_run")
  component: text('component').notNull(), // Component name (e.g., "AdvisorAgent", "MarketScanWorkflow")
  status: text('status').notNull(), // "started", "success", "error"
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  duration: integer('duration'), // milliseconds
  metadata: text('metadata'), // JSON stringified metadata
  createdAt: text('created_at').notNull(),
});

// Detailed event logs within traces
export const traceEvents = sqliteTable('trace_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  traceId: text('trace_id').notNull(), // Links to traces.traceId
  eventId: text('event_id').notNull(), // UUID for this event
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(), // "debug", "info", "warn", "error"
  component: text('component').notNull(),
  action: text('action').notNull(), // What action is being performed
  message: text('message').notNull(),
  data: text('data'), // JSON stringified data
  codeLocation: text('code_location'), // File:line for code traceability
  createdAt: text('created_at').notNull(),
});

// Application logs table
export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(), // "debug", "info", "warn", "error", "fatal"
  component: text('component').notNull(),
  message: text('message').notNull(),
  traceId: text('trace_id'), // Optional link to trace
  userId: text('user_id'), // Optional user identifier
  sessionId: text('session_id'), // Optional session identifier
  requestId: text('request_id'), // Optional request identifier
  error: text('error'), // JSON stringified error object
  metadata: text('metadata'), // JSON stringified additional data
  createdAt: text('created_at').notNull(),
});
