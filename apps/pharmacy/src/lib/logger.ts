/**
 * 统一日志系统
 * 在开发环境输出详细日志，生产环境仅输出错误和警告
 */

import { isDevelopment } from './env';

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 日志上下文接口
 */
interface LogContext {
  [key: string]: unknown;
}

/**
 * 日志工具类
 */
class Logger {
  /**
   * 格式化日志消息
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * Debug日志 - 仅开发环境
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Info日志 - 仅开发环境
   */
  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  /**
   * Log日志 - 仅开发环境（与info相同）
   */
  log(message: string, context?: LogContext): void {
    this.info(message, context);
  }

  /**
   * Warning日志 - 开发和生产环境都输出
   */
  warn(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    } else {
      // 生产环境简化输出
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Error日志 - 开发和生产环境都输出
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (isDevelopment) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
      if (error) {
        console.error(error);
      }
    } else {
      // 生产环境简化输出
      console.error(`[ERROR] ${message}`);
      if (error instanceof Error) {
        console.error(error.message);
        // 可以在这里集成错误监控服务（如Sentry）
        // if (window.Sentry) {
        //   window.Sentry.captureException(error, { extra: context });
        // }
      }
    }
  }

  /**
   * Group开始 - 仅开发环境
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(label);
    }
  }

  /**
   * Group结束 - 仅开发环境
   */
  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * 表格输出 - 仅开发环境
   */
  table(data: unknown): void {
    if (isDevelopment) {
      console.table(data);
    }
  }

  /**
   * 计时开始 - 仅开发环境
   */
  time(label: string): void {
    if (isDevelopment) {
      console.time(label);
    }
  }

  /**
   * 计时结束 - 仅开发环境
   */
  timeEnd(label: string): void {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// 导出单例实例
export const logger = new Logger();

// 也导出默认实例
export default logger;
