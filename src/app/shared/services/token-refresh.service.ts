import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AccountService } from './account.service';
import { ErrorLoggingService } from './error-logging.service';

export interface Login {
    email: string;
    password: string;
    rememberMe?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  public tokenRefreshed$ = this.refreshTokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private accountService: AccountService,
    private errorLogger: ErrorLoggingService
  ) {}

  /**
   * Attempt to refresh the token
   * This method tries multiple strategies:
   * 1. Use refresh token endpoint if available
   * 2. Re-authenticate using stored credentials
   * 3. Return null if refresh is not possible
   */
    environment = {
    production: false,
    urlAddress: 'https://localhost:7274',
  };
  refreshToken(): Observable<string | null> {
    // If refresh is already in progress, return the subject
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.asObservable();
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    // Try to get refresh token from storage
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      // Strategy 1: Use refresh token endpoint
      return this.refreshTokenUsingRefreshToken(refreshToken);
    } else {
      // Strategy 2: Try to re-authenticate (if credentials are stored)
      return this.refreshTokenUsingStoredCredentials();
    }
  }

  /**
   * Refresh token using refresh token endpoint
   */
  private refreshTokenUsingRefreshToken(refreshToken: string): Observable<string | null> {
    const url = `${this.environment.urlAddress}/api/Account/RefreshToken`;
    
    return this.http.post<{ token: string; refreshToken?: string }>(url, { refreshToken }).pipe(
      tap((response) => {
        if (response.token) {
          // Store new token
          sessionStorage.setItem('token', JSON.stringify(response.token));
          if (response.refreshToken) {
            this.storeRefreshToken(response.refreshToken);
          }
          this.refreshTokenSubject.next(response.token);
          this.refreshTokenInProgress = false;
          this.errorLogger.logInfo('Token refreshed successfully');
        }
      }),
      // Map the response to return just the token string
      map((response) => response.token || null),
      catchError((error) => {
        this.errorLogger.logError('Token refresh failed', error);
        this.refreshTokenInProgress = false;
        this.refreshTokenSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  /**
   * Attempt to refresh token using stored credentials
   * Note: This requires credentials to be stored securely
   */
  private refreshTokenUsingStoredCredentials(): Observable<string | null> {
    // Check if we have stored credentials (only if user opted for "remember me")
    const storedCredentials = this.getStoredCredentials();
    
    if (!storedCredentials) {
      this.refreshTokenInProgress = false;
      this.refreshTokenSubject.next(null);
      return throwError(() => new Error('No refresh mechanism available'));
    }

    // Re-authenticate using stored credentials
    const loginCredentials: Login = {
      email: storedCredentials.email,
      password: storedCredentials.password
    };

    return this.accountService.login('api/Account/Login', loginCredentials).pipe(
      tap((response) => {
        if (response && response.token) {
          this.refreshTokenSubject.next(response.token);
          this.errorLogger.logInfo('Token refreshed via re-authentication');
        }
        this.refreshTokenInProgress = false;
      }),
      // Map the response to return just the token string
      map((response) => (response && response.token ? response.token : null)),
      catchError((error) => {
        this.errorLogger.logError('Token refresh via re-authentication failed', error);
        this.refreshTokenInProgress = false;
        this.refreshTokenSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get refresh token from storage
   */
  private getRefreshToken(): string | null {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken') || 
                          localStorage.getItem('refreshToken');
      return refreshToken ? JSON.parse(refreshToken) : null;
    } catch {
      return null;
    }
  }

  /**
   * Store refresh token
   */
  private storeRefreshToken(token: string): void {
    sessionStorage.setItem('refreshToken', JSON.stringify(token));
  }

  /**
   * Get stored credentials (only if remember me was checked)
   * Note: In production, credentials should be encrypted
   */
  private getStoredCredentials(): { email: string; password: string } | null {
    try {
      const credentials = localStorage.getItem('rememberedCredentials');
      if (credentials) {
        // Decrypt if encrypted (implement encryption if needed)
        return JSON.parse(credentials);
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Check if token refresh is in progress
   */
  isRefreshing(): boolean {
    return this.refreshTokenInProgress;
  }

  /**
   * Reset refresh state
   */
  reset(): void {
    this.refreshTokenInProgress = false;
    this.refreshTokenSubject.next(null);
  }
}

