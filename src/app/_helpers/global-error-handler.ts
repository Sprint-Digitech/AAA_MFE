import { ErrorHandler, Injectable } from '@angular/core';
import { AccountService } from '../shared/services/account.service';
import { NotificationService } from '../shared/services/notification.service';
import { ErrorLoggingService } from '../shared/services/error-logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private errorLogger: ErrorLoggingService,
    private accountService: AccountService,
    private notificationService: NotificationService
  ) {}

  handleError(error: any): void {
    // Log the error
    this.errorLogger.logError('Unhandled error occurred', error, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Extract error message
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Show user-friendly error message
    // Only show notification for critical errors in production
    if (this.shouldShowNotification(error)) {
      this.notificationService.showError(errorMessage);
    }

    // Log to console in development
    if (!this.isProduction()) {
      console.error('Global Error Handler:', error);
    }

    // Re-throw the error to maintain default behavior
    // In production, you might want to prevent this to avoid showing error overlay
    if (this.isProduction()) {
      // Optionally prevent default error overlay in production
      // return;
    }
  }

  /**
   * Determine if error notification should be shown
   */
  private shouldShowNotification(error: any): boolean {
    // Don't show notification for network errors (handled by network service)
    if (
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('Failed to fetch')
    ) {
      return false;
    }

    // Don't show notification for HTTP errors (handled by error interceptor)
    if (error?.status || error?.error?.status) {
      return false;
    }

    // Don't show notification for common/expected errors
    if (
      error?.message?.includes('404') ||
      error?.message?.includes('Not Found') ||
      error?.message?.includes('null') ||
      error?.message?.includes('undefined')
    ) {
      return false;
    }

    // Only show notification for truly unexpected application errors
    return true;
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return (
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
    );
  }
}
