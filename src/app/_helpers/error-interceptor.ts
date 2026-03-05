import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NotificationService } from '../shared/services/notification.service';
import { AccountService } from '../shared/services/account.service';
import { ErrorLoggingService } from '../shared/services/error-logging.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector,
    private errorLogger: ErrorLoggingService
  ) { }

  private get notificationService(): NotificationService {
    return this.injector.get(NotificationService);
  }

  private get accountService(): AccountService {
    return this.injector.get(AccountService);
  }

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log all errors
        this.errorLogger.logError(
          `HTTP Error: ${error.status} ${error.statusText}`,
          error,
          {
            url: error.url,
            method: error.url ? new URL(error.url).pathname : 'unknown',
          }
        );

        // Handle 401 Unauthorized - Token expired or invalid
        // Note: Token refresh interceptor will handle 401 first, this is a fallback
        if (error.status === 401) {
          // Only logout if user is still logged in (token refresh might have already logged out)
          const token = sessionStorage.getItem('token');
          if (token) {
            const errorMessage =
              error?.error?.Error?.Message ||
              'Session expired. Please login again.';
            // Auto-logout on token expiration (if refresh failed)
            this.accountService.logout();
            this.notificationService.showError(errorMessage);
          }
          return throwError(() => error);
        }

        const errorUrl = error.url || '';
        const err = error?.error;

        // Skip showing error messages for specific APIs that are optional or expected to fail sometimes
        const skipErrorApis = [
          'GetAnnualComponentForSalary',
          'GetDisbursementByMonthAndYear',
          'GetAllLeaveMaster',
          'CompanyList',
          'EmployeeBasic',
          'DepartmentList',
          'DesignationList',
          'GetAttendenc',
          'GetEmployeeAttendanceSource',
        ];

        // Skip error notifications for image assets (404s on images are common and not critical)
        const isImageAsset = errorUrl.match(
          /\.(png|jpg|jpeg|gif|svg|ico|webp)(\?|$)/i
        );

        // Check if this error should be skipped
        const shouldSkipError =
          skipErrorApis.some((apiPath) => errorUrl.includes(apiPath)) ||
          isImageAsset;

        // Handle specific error status codes - Only show errors for critical failures
        if (error.status === 404) {
          // Skip 404 errors silently by default - they're often expected
          return throwError(() => error);
        } else if (error.status === 0 || !error.status) {
          // Skip network errors silently - components can handle these
          return throwError(() => error);
        } else if (error.status == 403) {
          // Only show 403 for critical resources
          if (!shouldSkipError) {
            const errorMessage = err?.Error?.Message || 'Forbidden Access';
            this.notificationService.showError(errorMessage);
          }
          return throwError(() => error);
        } else if (error.status >= 500) {
          // Only show 500+ errors for critical failures
          if (!shouldSkipError) {
            const errorMessage =
              err?.Error?.DetailedError ||
              err?.Error?.Message ||
              'Server Error';
            this.notificationService.showError(errorMessage);
          }
          return throwError(() => error);
        } else if (error.status === 400) {
          // Skip 400 errors silently - components can handle validation errors themselves
          return throwError(() => error);
        } else if (error.status === 409) {
          // Skip 409 errors silently - components can handle conflict errors
          return throwError(() => error);
        }

        // For any other error status codes, skip showing errors silently
        // Components should handle their own errors as needed
        return throwError(() => error);
      })
    );
  }
}
