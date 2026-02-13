import { Injectable } from '@angular/core';

export enum AuditEventType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  SECURITY_EVENT = 'SECURITY_EVENT',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  details: any;
  ipAddress: string | null;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLoggingService {
  private readonly MAX_LOGS = 1000;
  private auditLogs: AuditLog[] = [];
  private readonly STORAGE_KEY = 'app_audit_logs';

  constructor() {
    this.loadLogsFromStorage();
  }

  /**
   * Log an audit event
   */
  logEvent(
    eventType: AuditEventType,
    action: string,
    resource: string,
    details?: any,
    success: boolean = true,
    errorMessage?: string
  ): void {
    const user = this.getCurrentUser();
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      eventType,
      userId: user?.id || null,
      userEmail: user?.email || null,
      action,
      resource,
      details: details || {},
      ipAddress: null, // Would be set by backend
      userAgent: navigator.userAgent,
      success,
      errorMessage,
    };

    this.auditLogs.push(log);

    // Keep only recent logs
    if (this.auditLogs.length > this.MAX_LOGS) {
      this.auditLogs = this.auditLogs.slice(-this.MAX_LOGS);
    }

    // Save to storage
    this.saveLogsToStorage();

    // Send to backend (if available)
    this.sendToBackend(log);
  }

  /**
   * Log login event
   */
  logLogin(success: boolean, errorMessage?: string): void {
    this.logEvent(
      AuditEventType.LOGIN,
      'User login attempt',
      'Authentication',
      {},
      success,
      errorMessage
    );
  }

  /**
   * Log logout event
   */
  logLogout(): void {
    this.logEvent(
      AuditEventType.LOGOUT,
      'User logout',
      'Authentication',
      {},
      true
    );
  }

  /**
   * Log data access
   */
  logDataAccess(resource: string, details?: any): void {
    this.logEvent(
      AuditEventType.DATA_ACCESS,
      'Data accessed',
      resource,
      details,
      true
    );
  }

  /**
   * Log data modification
   */
  logDataModification(
    resource: string,
    details?: any,
    success: boolean = true
  ): void {
    this.logEvent(
      AuditEventType.DATA_MODIFICATION,
      'Data modified',
      resource,
      details,
      success
    );
  }

  /**
   * Log data deletion
   */
  logDataDeletion(
    resource: string,
    details?: any,
    success: boolean = true
  ): void {
    this.logEvent(
      AuditEventType.DATA_DELETION,
      'Data deleted',
      resource,
      details,
      success
    );
  }

  /**
   * Log security event
   */
  logSecurityEvent(action: string, details?: any): void {
    this.logEvent(
      AuditEventType.SECURITY_EVENT,
      action,
      'Security',
      details,
      false // Security events are typically failures
    );
  }

  /**
   * Get all audit logs
   */
  getLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Get logs by event type
   */
  getLogsByType(eventType: AuditEventType): AuditLog[] {
    return this.auditLogs.filter((log) => log.eventType === eventType);
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userEmail: string): AuditLog[] {
    return this.auditLogs.filter((log) => log.userEmail === userEmail);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): AuditLog[] {
    return this.auditLogs.slice(-count);
  }

  /**
   * Get failed events
   */
  getFailedEvents(): AuditLog[] {
    return this.auditLogs.filter((log) => !log.success);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.auditLogs = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get current user information
   */
  private getCurrentUser(): { id: string; email: string } | null {
    try {
      const user = sessionStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return {
          id: parsed.employeeId || parsed.id || '',
          email:
            parsed.email || parsed.employeeEmail || parsed.loginEmail || '',
        };
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save logs to localStorage
   */
  private saveLogsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.auditLogs));
    } catch (error) {
      // localStorage might be full
      console.warn('Failed to save audit logs:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.auditLogs = JSON.parse(stored).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Send audit log to backend
   */
  private sendToBackend(log: AuditLog): void {
    // TODO: Implement backend API call
    // This would send critical security events to the backend
    if (
      log.eventType === AuditEventType.SECURITY_EVENT ||
      (log.eventType === AuditEventType.LOGIN && !log.success)
    ) {
      // Send critical events immediately
      // Example: this.http.post('/api/audit', log).subscribe();
    }
  }
}
