/**
 * Logging Utility
 * 
 * Provides structured logging with configurable levels.
 * Logs to stderr to avoid interfering with MCP stdio communication.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  timestamp: boolean;
}

interface Logger {
  level: LogLevel;
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void;
  child(childPrefix: string): Logger;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * Create a logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const level = config?.level ?? (process.env.OPENCODE_LOG_LEVEL as LogLevel) ?? 'info';
  const prefix = config?.prefix ?? 'opencode-mcp';
  const timestamp = config?.timestamp ?? process.env.OPENCODE_LOG_TIMESTAMP === 'true';
  
  const currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  
  function formatMessage(message: string, meta?: Record<string, unknown>): string {
    let formatted = '';
    
    if (timestamp) {
      formatted += `[${new Date().toISOString()}] `;
    }
    
    formatted += `[${prefix}] ${message}`;
    
    if (meta && Object.keys(meta).length > 0) {
      formatted += ` ${JSON.stringify(meta)}`;
    }
    
    return formatted;
  }
  
  return {
    level,
    
    debug(message: string, meta?: Record<string, unknown>): void {
      if (currentLevel <= LOG_LEVELS.debug) {
        console.error(`[DEBUG] ${formatMessage(message, meta)}`);
      }
    },
    
    info(message: string, meta?: Record<string, unknown>): void {
      if (currentLevel <= LOG_LEVELS.info) {
        console.error(`[INFO] ${formatMessage(message, meta)}`);
      }
    },
    
    warn(message: string, meta?: Record<string, unknown>): void {
      if (currentLevel <= LOG_LEVELS.warn) {
        console.error(`[WARN] ${formatMessage(message, meta)}`);
      }
    },
    
    error(message: string, meta?: Record<string, unknown>): void {
      if (currentLevel <= LOG_LEVELS.error) {
        console.error(`[ERROR] ${formatMessage(message, meta)}`);
      }
    },
    
    /**
     * Log with a custom level
     */
    log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
      switch (level) {
        case 'debug':
          this.debug(message, meta);
          break;
        case 'info':
          this.info(message, meta);
          break;
        case 'warn':
          this.warn(message, meta);
          break;
        case 'error':
          this.error(message, meta);
          break;
      }
    },
    
    /**
     * Create a child logger with a different prefix
     */
    child(childPrefix: string): Logger {
      return createLogger({
        level,
        prefix: `${prefix}:${childPrefix}`,
        timestamp,
      });
    },
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger();
