/**
 * Logger utility for conditional logging based on environment
 * Logs are only output in development mode by default
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (dev only)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log errors (dev only by default, but can be configured to log in production)
   */
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
  },

  /**
   * Log warnings (dev only)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log informational messages (dev only)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log debug messages (dev only)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};
