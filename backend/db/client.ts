import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// This file is a placeholder for your database client.
// You can export a function that creates a new drizzle instance.

export function createDbClient(database: D1Database) {
  return drizzle(database, { schema });
}