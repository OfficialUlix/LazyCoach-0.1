import * as FileSystem from 'expo-file-system';

const LOG_FILE_PATH = `${FileSystem.documentDirectory}LCL2.txt`;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logQueue: string[] = [];
  private isWriting = false;

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private async writeToFile(message: string) {
    try {
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, message, {
        append: true,
      });
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error);
    }
  }

  private async processLogQueue() {
    if (this.isWriting || this.logQueue.length === 0) return;
    
    this.isWriting = true;
    const messages = [...this.logQueue];
    this.logQueue = [];

    const logText = messages.join('\n') + '\n';
    await this.writeToFile(logText);
    
    this.isWriting = false;

    // Process remaining logs if any
    if (this.logQueue.length > 0) {
      this.processLogQueue();
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const formattedMessage = `[${timestamp}] [${levelName}] ${message}`;
    const argsText = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    const fullMessage = formattedMessage + argsText;

    // Always log to console
    console.log(fullMessage);

    // Add to queue for file writing
    this.logQueue.push(fullMessage);
    this.processLogQueue();
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  async clearLogs() {
    try {
      await FileSystem.deleteAsync(LOG_FILE_PATH);
    } catch (error) {
      console.error('Failed to clear log file:', error);
    }
  }

  async getLogs(): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(LOG_FILE_PATH);
    } catch (error) {
      return '';
    }
  }

  getLogFilePath(): string {
    return LOG_FILE_PATH;
  }
}

export const logger = new Logger();

// Intercept console methods to also log to file
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

console.log = (...args: any[]) => {
  originalConsole.log(...args);
  logger.info('CONSOLE', ...args);
};

console.info = (...args: any[]) => {
  originalConsole.info(...args);
  logger.info('CONSOLE_INFO', ...args);
};

console.warn = (...args: any[]) => {
  originalConsole.warn(...args);
  logger.warn('CONSOLE_WARN', ...args);
};

console.error = (...args: any[]) => {
  originalConsole.error(...args);
  logger.error('CONSOLE_ERROR', ...args);
};