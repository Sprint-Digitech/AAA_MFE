import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { SecureTokenStorageService } from '../shared/services/secure-token-storage.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private secureTokenStorage: SecureTokenStorageService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = request.url.toLowerCase();
    
    // Check various token sources
    let token = this.secureTokenStorage.getToken();
    let source = 'SecureStorage';

    if (!token) {
      // Fallback 1: Raw sessionStorage 'token'
      const rawSessionToken = sessionStorage.getItem('token');
      if (rawSessionToken) {
        token = this.parseTokenValue(rawSessionToken);
        source = 'sessionStorage.token';
        console.log(`[LOGIN_MFE JwtInterceptor] Found token in sessionStorage.token: ${token ? 'valid' : 'invalid'}`);
      }
    }

    if (!token) {
      // Fallback 2: Raw localStorage 'token' or 'auth_token'
      const rawLocalToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (rawLocalToken) {
        token = this.parseTokenValue(rawLocalToken);
        source = 'localStorage';
        console.log(`[LOGIN_MFE JwtInterceptor] Found token in localStorage: ${token ? 'valid' : 'invalid'}`);
      }
    }

    // Diagnostic logging
    if (token && token !== 'null' && token !== 'undefined') {
      console.log(`[LOGIN_MFE JwtInterceptor] Token found via ${source}. Adding to request: ${request.method} ${request.url}`);
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    } else {
      console.warn(`[LOGIN_MFE JwtInterceptor] NO TOKEN FOUND in any storage for request: ${request.method} ${request.url}`);
      console.log('[LOGIN_MFE JwtInterceptor] Storage State:', {
        hasSessionToken: !!sessionStorage.getItem('token'),
        hasSessionAuth: !!sessionStorage.getItem('auth_token'),
        hasLocalToken: !!localStorage.getItem('token'),
        hasLocalAuth: !!localStorage.getItem('auth_token')
      });
    }

    return next.handle(request);
  }

  private parseTokenValue(val: string): string | null {
    if (!val || val === 'null' || val === 'undefined') return null;
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed.token || parsed.accessToken || val;
      }
      return parsed;
    } catch {
      return val;
    }
  }
}
