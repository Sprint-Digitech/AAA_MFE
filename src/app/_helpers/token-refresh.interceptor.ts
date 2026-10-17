import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { TokenRefreshService } from '../shared/services/token-refresh.service';
import { AccountService } from '../shared/services/account.service';
import { SecureTokenStorageService } from '../shared/services/secure-token-storage.service';

@Injectable()
export class TokenRefreshInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private tokenRefreshService: TokenRefreshService,
    private accountService: AccountService,
    private secureTokenStorage: SecureTokenStorageService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip token refresh for authentication endpoints
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    // No session at all (public pages like #/reset and #/forgot-password): the app shell still
    // fires GetCompany on startup, and its 401 just means "not signed in". There's nothing to
    // refresh, and logout() would navigate to /login - kicking the user off the reset link.
    if (!this.hasSession()) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only handle 401 errors and if we're not already refreshing
        if (error.status === 401 && !this.isRefreshing) {
          return this.handle401Error(request, next);
        }

        // For other errors, just throw them
        return throwError(() => error);
      })
    );
  }

  private hasSession(): boolean {
    return !!(this.secureTokenStorage.getToken() || sessionStorage.getItem('token'));
  }

  /**
   * Check if request is to an authentication endpoint
   */
  private isAuthEndpoint(url: string): boolean {
    const normalizedUrl = url.toLowerCase();
    return normalizedUrl.includes('/api/account/login') ||
      normalizedUrl.includes('/api/account/refreshtoken') ||
      normalizedUrl.includes('/api/account/google-login') ||
      normalizedUrl.includes('/api/account/register') ||
      // SSO sign-in: a 401 means a bad/expired one-time code, not an expired session.
      normalizedUrl.includes('/api/sso/');
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.tokenRefreshService.refreshToken().pipe(
        switchMap((token: string | null) => {
          if (token) {
            // Token refresh successful, retry the original request
            this.isRefreshing = false;
            this.refreshTokenSubject.next(token);

            // Update the request with new token
            const tokenValue = sessionStorage.getItem('token');
            const parsedToken = tokenValue ? JSON.parse(tokenValue) : token;

            request = request.clone({
              setHeaders: {
                Authorization: `Bearer ${parsedToken}`
              }
            });

            return next.handle(request);
          } else {
            // Token refresh failed, logout user
            this.isRefreshing = false;
            this.accountService.logout();
            return throwError(() => new Error('Token refresh failed'));
          }
        }),
        catchError((error) => {
          // If refresh fails, logout user
          this.isRefreshing = false;
          this.accountService.logout();
          return throwError(() => error);
        })
      );
    } else {
      // If refresh is in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          const tokenValue = sessionStorage.getItem('token');
          const parsedToken = tokenValue ? JSON.parse(tokenValue) : token;

          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${parsedToken}`
            }
          });

          return next.handle(request);
        })
      );
    }
  }
}

