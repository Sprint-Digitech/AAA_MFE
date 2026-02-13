import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SecureTokenStorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly ENCRYPTION_KEY = 'app_encryption_key'; // In production, use proper key management

  /**
   * Store token securely
   */
  setToken(token: string, useSessionStorage: boolean = true): void {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    // In production, encrypt the token before storing
    const encrypted = this.encrypt(token);
    storage.setItem(this.TOKEN_KEY, encrypted);
  }

  /**
   * Get token
   */
  getToken(): string | null {
    // Try sessionStorage first
    let encrypted = sessionStorage.getItem(this.TOKEN_KEY);
    if (!encrypted) {
      encrypted = localStorage.getItem(this.TOKEN_KEY);
    }

    if (!encrypted) {
      return null;
    }

    try {
      return this.decrypt(encrypted);
    } catch {
      // If decryption fails, try raw value (backward compatibility)
      return encrypted;
    }
  }

  /**
   * Store refresh token
   */
  setRefreshToken(token: string, useSessionStorage: boolean = true): void {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    const encrypted = this.encrypt(token);
    storage.setItem(this.REFRESH_TOKEN_KEY, encrypted);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    let encrypted = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!encrypted) {
      encrypted = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    if (!encrypted) {
      return null;
    }

    try {
      return this.decrypt(encrypted);
    } catch {
      return encrypted;
    }
  }

  /**
   * Remove token
   */
  removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Remove refresh token
   */
  removeRefreshToken(): void {
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Clear all tokens
   */
  clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Simple encryption (for demonstration - use proper encryption in production)
   */
  private encrypt(text: string): string {
    // Simple base64 encoding (not secure - use proper encryption in production)
    // In production, use Web Crypto API or a library like crypto-js
    try {
      return btoa(text);
    } catch {
      return text; // Fallback if encoding fails
    }
  }

  /**
   * Simple decryption (for demonstration - use proper decryption in production)
   */
  private decrypt(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch {
      return encrypted; // Fallback if decoding fails
    }
  }

  /**
   * Validate token format (basic validation)
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic validation - check if it looks like a JWT
    const parts = token.split('.');
    if (parts.length === 3) {
      // Likely a JWT token
      return true;
    }

    // Or check for minimum length
    return token.length >= 10;
  }
}
