/**
 * Système de logging centralisé
 * Respecte NODE_ENV et désactive les logs debug en production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Formate un timestamp pour les logs
 */
function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Formate un message de log avec timestamp et niveau
 */
function formatLog(level: LogLevel, message: string, ...args: unknown[]): void {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'debug':
      if (isDevelopment) {
        console.log(prefix, message, ...args);
      }
      break;
    case 'info':
      console.info(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'error':
      console.error(prefix, message, ...args);
      break;
  }
}

/**
 * Logger centralisé avec niveaux de log
 */
export const logger = {
  /**
   * Log de debug (visible uniquement en développement)
   */
  debug: (message: string, ...args: unknown[]) => {
    formatLog('debug', message, ...args);
  },

  /**
   * Log d'information (toujours visible)
   */
  info: (message: string, ...args: unknown[]) => {
    formatLog('info', message, ...args);
  },

  /**
   * Log d'avertissement (toujours visible)
   */
  warn: (message: string, ...args: unknown[]) => {
    formatLog('warn', message, ...args);
  },

  /**
   * Log d'erreur (toujours visible)
   */
  error: (message: string, ...args: unknown[]) => {
    formatLog('error', message, ...args);
  },
};


