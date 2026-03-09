/**
 * Simple logging utility
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
const enableDebug = process.env.DEBUG === 'true';

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
};

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

const formatMessage = (level: LogLevel, message: string, data?: unknown): string => {
  let formatted = `[${formatTimestamp()}] [${level.toUpperCase()}] ${message}`;
  if (data !== undefined) {
    formatted += ` ${JSON.stringify(data)}`;
  }
  return formatted;
};

export const logger = {
  debug: (message: string, data?: unknown): void => {
    if (enableDebug && shouldLog('debug')) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info: (message: string, data?: unknown): void => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn: (message: string, data?: unknown): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error: (message: string, error?: Error | unknown): void => {
    if (shouldLog('error')) {
      if (error instanceof Error) {
        console.error(formatMessage('error', message, { message: error.message, stack: error.stack }));
      } else {
        console.error(formatMessage('error', message, error));
      }
    }
  },
};
