/**
 * Centralized Logging Utility
 * Provides structured logging with different levels and environment-aware behavior.
 *
 * In production, errors and warnings are captured by Sentry.
 * In development, logs are output to the console.
 *
 * @module utils/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  environment: string;
}

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;
const LOG_LEVEL =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) || (IS_PRODUCTION ? 'warn' : 'debug');

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Lazy-loaded Sentry reference (set via initSentry)
let sentryModule: {
  captureMessage: (msg: string, opts?: unknown) => void;
  captureException: (err: unknown, opts?: unknown) => void;
  setContext: (name: string, ctx: Record<string, unknown> | null) => void;
} | null = null;

/**
 * Initialize Sentry integration. Call once at app startup.
 * Lazy-loads @sentry/react to avoid bundling it in dev.
 */
export async function initSentry(): Promise<void> {
  if (!IS_PRODUCTION) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[logger] VITE_SENTRY_DSN not set — Sentry disabled');
    return;
  }

  try {
    // Dynamic import — @sentry/react is an optional peer dependency.
    // If not installed, this will fail gracefully.
    // Using string variable to bypass Vite's static import analysis.
    const sentryPkg = '@sentry/react';
    const Sentry = await import(/* @vite-ignore */ sentryPkg);
    Sentry.init({
      dsn,
      environment: 'production',
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event: any) {
        // Strip PII from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((bc: any) => {
            if (bc.data?.url) {
              try {
                const url = new URL(bc.data.url as string, window.location.origin);
                url.searchParams.delete('token');
                url.searchParams.delete('key');
                bc.data.url = url.toString();
              } catch {
                // Invalid URL, skip
              }
            }
            return bc;
          });
        }
        return event;
      },
    });
    sentryModule = Sentry;
  } catch {
    console.warn('[logger] @sentry/react not available — install it for production error tracking');
  }
}

/**
 * Checks if a log level should be output based on current configuration.
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

/**
 * Creates a log entry object.
 */
function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: IS_PRODUCTION ? 'production' : 'development',
  };
}

/**
 * Sends log to Sentry in production.
 */
function sendToSentry(entry: LogEntry): void {
  if (!IS_PRODUCTION || !sentryModule) return;

  sentryModule.captureMessage(entry.message, {
    level: entry.level,
    extra: entry.context,
  });
}

/**
 * Sends an exception to Sentry in production.
 */
function sendExceptionToSentry(error: Error, context?: LogContext): void {
  if (!IS_PRODUCTION || !sentryModule) return;

  sentryModule.captureException(error, {
    extra: context,
  });
}

/**
 * Outputs log to console in development.
 */
function outputToConsole(entry: LogEntry): void {
  if (IS_DEV) {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.context || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.context || '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.context || '');
        break;
    }
  }
}

/**
 * Main logging function.
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, message, context);

  // Output to console in development
  outputToConsole(entry);

  // Send to Sentry in production (only for warn and error)
  if (IS_PRODUCTION && (level === 'warn' || level === 'error')) {
    sendToSentry(entry);
  }
}

/**
 * Logger instance with convenient methods.
 *
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('Debug message', { userId: '123' });
 * logger.info('User logged in', { email: 'user@example.com' });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 * logger.error('Failed to fetch data', { error: err.message });
 * ```
 */
export const logger = {
  /**
   * Log a debug message (development only).
   */
  debug: (message: string, context?: LogContext) => log('debug', message, context),

  /**
   * Log an info message.
   */
  info: (message: string, context?: LogContext) => log('info', message, context),

  /**
   * Log a warning message.
   */
  warn: (message: string, context?: LogContext) => log('warn', message, context),

  /**
   * Log an error message.
   */
  error: (message: string, context?: LogContext) => log('error', message, context),

  /**
   * Log an error with exception details. Sends exception to Sentry.
   */
  exception: (message: string, error: Error, context?: LogContext) => {
    log('error', message, {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });

    sendExceptionToSentry(error, {
      ...context,
      message,
    });
  },
};

export default logger;
