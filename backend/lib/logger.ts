import { drizzle } from 'drizzle-orm/d1';
import { traces, traceEvents, logs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { LogLevel, LogContext, TraceContext } from '../types';

export class Logger {
  // ... (class is correct)
  async log(level: LogLevel, message: string, context: LogContext, error?: Error): Promise<void> {
    // ... (implementation is correct)
  }
  
  async info(message: string, context: LogContext) {
    await this.log('info', message, context);
  }
}

export async function withTrace<T>(
  logger: Logger,
  context: TraceContext,
  fn: (traceId: string) => Promise<T>
): Promise<T> {
  // ... (implementation is correct)
  return fn(context.traceId);
}
