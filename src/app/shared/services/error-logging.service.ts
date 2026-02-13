import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorLog {
  timestamp: Date;
  message: string;
  stack?: string;
  url?: string;
  status?: number;
  statusText?: string;
  user?: any;
  userAgent?: string;
  additionalInfo?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggingService {
  private readonly MAX_LOGS = 100; // Maximum number of logs to keep in memory
  private logs: ErrorLog[] = [];
  private readonly STORAGE_KEY = 'app_error_logs';

  constructor() {
    this.loadLogsFromStorage();
  }

  /**
   * Log an error with context
   */
  logError(
    message: string,
    error?: Error | HttpErrorResponse | any,
    additionalInfo?: any
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      message,
      stack: error?.stack || error?.error?.stack,
      url: error?.url,
      status: error?.status,
      statusText: error?.statusText,
      user: this.getCurrentUser(),
      userAgent: navigator.userAgent,
      additionalInfo: additionalInfo || error?.error
    };

    // Add to in-memory logs
    this.logs.push(errorLog);

    // Keep only the last MAX_LOGS
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Log to console in development
    if (!this.isProduction()) {
      console.error('Error Log:', errorLog);
    }

    // Save to localStorage
    this.saveLogsToStorage();

    // Optionally send to remote logging service
    this.sendToRemoteLogging(errorLog);
  }

  /**
   * Log a warning
   */
  logWarning(message: string, additionalInfo?: any): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      message: `WARNING: ${message}`,
      user: this.getCurrentUser(),
      userAgent: navigator.userAgent,
      additionalInfo
    };

    this.logs.push(errorLog);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    if (!this.isProduction()) {
      console.warn('Warning Log:', errorLog);
    }

    this.saveLogsToStorage();
  }

  /**
   * Log informational message
   */
  logInfo(message: string, additionalInfo?: any): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      message: `INFO: ${message}`,
      user: this.getCurrentUser(),
      userAgent: navigator.userAgent,
      additionalInfo
    };

    this.logs.push(errorLog);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    this.saveLogsToStorage();
  }

  /**
   * Get all error logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get recent error logs (last N)
   */
  getRecentLogs(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(): void {
    const logsJson = this.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get current user from session
   */
  private getCurrentUser(): any {
    try {
      const user = sessionStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return {
          email: parsed.email || parsed.employeeEmail || parsed.loginEmail,
          employeeId: parsed.employeeId || parsed.employee?.employeeId,
          name: parsed.name || parsed.employeeName
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return !window.location.hostname.includes('localhost') &&
           !window.location.hostname.includes('127.0.0.1');
  }

  /**
   * Save logs to localStorage
   */
  private saveLogsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      // localStorage might be full or disabled
      console.warn('Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error);
    }
  }

  /**
   * Send error to remote logging service (optional)
   * Override this method to integrate with services like Sentry, LogRocket, etc.
   */
  private sendToRemoteLogging(errorLog: ErrorLog): void {
    // Only send critical errors in production
    if (this.isProduction() && errorLog.status && errorLog.status >= 500) {
      // TODO: Integrate with remote logging service
      // Example: this.sentryService.captureException(errorLog);
    }
  }
}

