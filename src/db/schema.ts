import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const marketSnapshots = sqliteTable('market_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  town: text('town').notNull(),
  flatType: text('flat_type').notNull(),
  price: integer('price').notNull(),
  yieldRate: integer('yield').notNull(),
  createdAt: text('created_at').notNull(),
});
