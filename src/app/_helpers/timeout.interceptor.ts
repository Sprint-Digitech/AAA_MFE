import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { ErrorLoggingService } from '../shared/services/error-logging.service';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
    private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

    constructor(private errorLogger: ErrorLoggingService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip timeout for registration or salary/reports requests
        if (this.shouldSkipTimeout(request)) {
            return next.handle(request);
        }

        // Get timeout from request headers or use default
        const timeoutValue = this.getTimeout(request);

        return next.handle(request).pipe(
            timeout(timeoutValue),
            catchError((error) => {
                if (error instanceof TimeoutError) {
                    const timeoutError = {
                        message: `Request timeout after ${timeoutValue}ms`,
                        url: request.url,
                        method: request.method
                    };

                    this.errorLogger.logError(
                        `Request timeout: ${request.method} ${request.url}`,
                        error,
                        timeoutError
                    );

                    return throwError(() => new Error(`Request timeout after ${timeoutValue}ms`));
                }

                return throwError(() => error);
            })
        );
    }

    /**
     * Check if timeout should be skipped for this request
     */
    private shouldSkipTimeout(request: HttpRequest<any>): boolean {
        const url = request.url.toLowerCase();

        // Skip if explicitly marked in headers
        if (request.headers.has('X-Skip-Timeout')) {
            return true;
        }

        // Skip for salary and reports APIs - these can be long-running
        if (url.includes('/salary') ||
            url.includes('/report') ||
            url.includes('salaryreportlist')) {
            return true;
        }

        // Skip timeout for registration requests
        if (url.includes('/api/account/registration') ||
            url.includes('/api/account/registrationundergrouptenant')) {
            return true;
        }

        return false;
    }

    /**
     * Get timeout value from request headers or use default
     */
    private getTimeout(request: HttpRequest<any>): number {
        const timeoutHeader = request.headers.get('X-Request-Timeout');

        if (timeoutHeader) {
            const timeout = parseInt(timeoutHeader, 10);
            if (!isNaN(timeout) && timeout > 0) {
                return timeout;
            }
        }

        // Use longer timeout for file uploads/downloads
        if (request.url.includes('/api/') &&
            (request.url.includes('/upload') ||
                request.url.includes('/download'))) {
            return this.DEFAULT_TIMEOUT * 3; // 90 seconds for file operations
        }

        return this.DEFAULT_TIMEOUT;
    }
}
