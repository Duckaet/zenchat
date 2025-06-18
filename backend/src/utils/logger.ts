interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('ERROR', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  private log(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };

    if (this.isDevelopment) {
      console.log(`[${timestamp}] ${level}: ${message}`, context || '');
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
}

export const logger = new Logger();
