import { Injectable } from '@angular/core';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class HttpCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached entries

  constructor() {
    // Clean up expired entries periodically
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  /**
   * Get cached response if available and not expired
   */
  get(requestKey: string): HttpResponse<any> | null {
    const entry = this.cache.get(requestKey);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(requestKey);
      return null;
    }

    // Return cloned response (immutable)
    return entry.response.clone();
  }

  /**
   * Store response in cache
   */
  set(requestKey: string, response: HttpResponse<any>, ttl?: number): void {
    // Don't cache if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      this.removeOldestEntry();
    }

    const expiresAt = Date.now() + (ttl || this.DEFAULT_TTL);

    this.cache.set(requestKey, {
      response: response.clone(),
      timestamp: Date.now(),
      expiresAt
    });
  }

  /**
   * Check if request should be cached
   */
  shouldCache(request: any, response: HttpResponse<any>): boolean {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return false;
    }

    // Don't cache if explicitly marked
    if (request.headers?.has('X-No-Cache')) {
      return false;
    }

    // Only cache successful responses
    if (response.status < 200 || response.status >= 300) {
      return false;
    }

    // Don't cache authentication endpoints
    if (request.url?.includes('/api/Account/login') ||
        request.url?.includes('/api/Account/RefreshToken')) {
      return false;
    }

    // Check if response has cache-control headers
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl?.includes('no-store') || cacheControl?.includes('no-cache')) {
      return false;
    }

    return true;
  }

  /**
   * Get cache TTL from response headers or use default
   */
  getCacheTTL(response: HttpResponse<any>): number {
    // Check for Cache-Control max-age
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        return parseInt(maxAgeMatch[1], 10) * 1000; // Convert to milliseconds
      }
    }

    // Check for Expires header
    const expires = response.headers.get('Expires');
    if (expires) {
      const expiresDate = new Date(expires);
      const ttl = expiresDate.getTime() - Date.now();
      if (ttl > 0) {
        return ttl;
      }
    }

    // Use default TTL
    return this.DEFAULT_TTL;
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(requestKey: string): void {
    this.cache.delete(requestKey);
  }

  /**
   * Invalidate cache for keys matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ key: string; age: number; expiresIn: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      expiresIn: entry.expiresAt - now
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * Remove oldest cache entry
   */
  private removeOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

