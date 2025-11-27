import { drizzle } from 'drizzle-orm/d1';
import { traces, traceEvents, logs } from '../db/schema';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type TraceStatus = 'started' | 'success' | 'error';

interface TraceContext {
  traceId: string;
  parentId?: string;
  component: string;
  name: string;
  metadata?: Record<string, any>;
}

interface LogContext {
  component: string;
  traceId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private db: ReturnType<typeof drizzle>;

  constructor(database: D1Database) {
    this.db = drizzle(database);
  }

  // Generate a simple UUID (for edge runtime compatibility)
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a new trace
  async startTrace(context: TraceContext): Promise<string> {
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      await this.db.insert(traces).values({
        id,
        traceId: context.traceId,
        parentId: context.parentId || null,
        name: context.name,
        component: context.component,
        status: 'started',
        startTime: now,
        endTime: null,
        duration: null,
        metadata: context.metadata ? JSON.stringify(context.metadata) : null,
        createdAt: now,
      });

      // Also log the trace start
      await this.logEvent({
        traceId: context.traceId,
        level: 'info',
        component: context.component,
        action: 'trace_start',
        message: `Started trace: ${context.name}`,
        data: context.metadata,
      });

      return id;
    } catch (error) {
      // Fallback to console if DB fails
      console.error('Failed to start trace:', error);
      return id;
    }
  }

  // End a trace
  async endTrace(
    id: string,
    status: 'success' | 'error',
    metadata?: Record<string, any>
  ): Promise<void> {
    const now = new Date().toISOString();

    try {
      // Get the trace to calculate duration
      const trace = await this.db.select().from(traces).where(eq(traces.id, id)).get();

      if (trace) {
        const duration = new Date(now).getTime() - new Date(trace.startTime).getTime();

        await this.db.update(traces)
          .set({
            status,
            endTime: now,
            duration,
            metadata: metadata ? JSON.stringify({ ...JSON.parse(trace.metadata || '{}'), ...metadata }) : trace.metadata,
          })
          .where(traces.id, id);

        // Log the trace end
        await this.logEvent({
          traceId: trace.traceId,
          level: status === 'success' ? 'info' : 'error',
          component: trace.component,
          action: 'trace_end',
          message: `Ended trace: ${trace.name} (${status}) - ${duration}ms`,
          data: { duration, status, ...metadata },
        });
      }
    } catch (error) {
      console.error('Failed to end trace:', error);
    }
  }

  // Log an event within a trace
  async logEvent(params: {
    traceId: string;
    level: LogLevel;
    component: string;
    action: string;
    message: string;
    data?: Record<string, any>;
    codeLocation?: string;
  }): Promise<void> {
    const eventId = this.generateId();
    const now = new Date().toISOString();

    try {
      await this.db.insert(traceEvents).values({
        traceId: params.traceId,
        eventId,
        timestamp: now,
        level: params.level,
        component: params.component,
        action: params.action,
        message: params.message,
        data: params.data ? JSON.stringify(params.data) : null,
        codeLocation: params.codeLocation || null,
        createdAt: now,
      });

      // Also output to console for real-time debugging
      const logMethod = params.level === 'error' ? console.error : console.log;
      logMethod(`[${params.level.toUpperCase()}] [${params.component}] ${params.action}: ${params.message}`, params.data || '');
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  // General logging (can be standalone or linked to a trace)
  async log(
    level: LogLevel,
    message: string,
    context: LogContext,
    error?: Error
  ): Promise<void> {
    const now = new Date().toISOString();

    try {
      await this.db.insert(logs).values({
        timestamp: now,
        level,
        component: context.component,
        message,
        traceId: context.traceId || null,
        userId: context.userId || null,
        sessionId: context.sessionId || null,
        requestId: context.requestId || null,
        error: error ? JSON.stringify({ name: error.name, message: error.message, stack: error.stack }) : null,
        metadata: context.metadata ? JSON.stringify(context.metadata) : null,
        createdAt: now,
      });

      // Also output to console
      const logMethod = level === 'error' || level === 'fatal' ? console.error : console.log;
      logMethod(`[${level.toUpperCase()}] [${context.component}] ${message}`, context.metadata || '', error || '');
    } catch (err) {
      console.error('Failed to write log:', err);
    }
  }

  // Convenience methods
  async debug(message: string, context: LogContext) {
    await this.log('debug', message, context);
  }

  async info(message: string, context: LogContext) {
    await this.log('info', message, context);
  }

  async warn(message: string, context: LogContext) {
    await this.log('warn', message, context);
  }

  async error(message: string, context: LogContext, error?: Error) {
    await this.log('error', message, context, error);
  }

  async fatal(message: string, context: LogContext, error?: Error) {
    await this.log('fatal', message, context, error);
  }
}

// Trace decorator/wrapper for automatic tracing
export async function withTrace<T>(
  logger: Logger,
  context: TraceContext,
  fn: (traceId: string) => Promise<T>
): Promise<T> {
  const traceRecordId = await logger.startTrace(context);

  try {
    const result = await fn(context.traceId);
    await logger.endTrace(traceRecordId, 'success');
    return result;
  } catch (error) {
    await logger.endTrace(traceRecordId, 'error', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
