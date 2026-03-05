import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-mfe-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="height: 100%; width: 100%; border: none; overflow: hidden;">
      <iframe #mfeIframe
              *ngIf="safeUrl" 
              [src]="safeUrl" 
              style="width: 100%; height: 100%; border: none;"
              frameborder="0"
              (load)="onIframeLoad()">
      </iframe>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  `]
})
export class MfeContainerComponent implements OnInit {
  @ViewChild('mfeIframe') mfeIframe!: ElementRef<HTMLIFrameElement>;
  safeUrl: SafeResourceUrl | null = null;
  mfeUrl: string = '';

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    // Listen for requests from the MFE (e.g., requesting the token)
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'REQUEST_TOKEN') {
        console.log('[MfeContainer] MFE requested token, sending...');
        this.sendTokenToMfe();
      }
    });

    // Subscribe to route data changes (handles MFE switches)
    this.route.data.subscribe(data => {
      const mfeBaseUrl = data['mfeUrl'] || 'https://test.fovestta.com/Auth/dist';
      console.log('[MfeContainer] Route data changed, Base URL:', mfeBaseUrl);
      this.updateIframeSrc(mfeBaseUrl);
    });

    // Subscribe to URL changes (handles navigation within the same MFE)
    this.route.url.subscribe(() => {
      const mfeBaseUrl = this.route.snapshot.data['mfeUrl'] || 'https://test.fovestta.com/Auth/dist';
      this.updateIframeSrc(mfeBaseUrl);
    });
  }

  onIframeLoad() {
    console.log('[MfeContainer] Iframe loaded, sending token...');
    // Small delay to ensure the MFE has initialized its message listener
    setTimeout(() => this.sendTokenToMfe(), 500);
  }

  private sendTokenToMfe() {
    if (this.mfeIframe && this.mfeIframe.nativeElement.contentWindow) {
      const token = sessionStorage.getItem('token');
      const user = sessionStorage.getItem('user');
      const tenantSchema = sessionStorage.getItem('tenantSchema');

      if (token) {
        let parsedToken;
        try {
          // If the token is stored as a JSON string (with quotes), parse it.
          // Otherwise, use the raw string (standard JWT).
          parsedToken = JSON.parse(token);
        } catch (e) {
          parsedToken = token;
        }

        let parsedUser = null;
        try {
          parsedUser = user ? JSON.parse(user) : null;
        } catch (e) {
          console.warn('[MfeContainer] Failed to parse user from session storage', e);
        }

        this.mfeIframe.nativeElement.contentWindow.postMessage({
          type: 'SET_TOKEN',
          token: parsedToken,
          user: parsedUser,
          tenantSchema: tenantSchema
        }, '*');
      }
    }
  }

  private updateIframeSrc(mfeBaseUrl: string) {
    const isLocal = window.location.hostname === 'localhost';
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const currentSearch = window.location.search;
    let targetUrl = mfeBaseUrl;

    // Define potential shell bases to strip
    const shellBases = ['/Gateway/dist', '/Auth/dist'];
    let relativePath = '';

    // Check hash first (main way routes are passed in hash mode)
    if (currentHash.startsWith('#/')) {
      relativePath = currentHash.substring(1).split('?')[0];
    } else {
      // Fallback to pathname
      relativePath = currentPath;
      for (const base of shellBases) {
        if (currentPath.startsWith(base)) {
          relativePath = currentPath.substring(base.length);
          break;
        }
      }
    }

    if (relativePath && relativePath !== '/' && relativePath !== '/dashboard') {
      const normalizedBase = mfeBaseUrl.endsWith('/') ? mfeBaseUrl.slice(0, -1) : mfeBaseUrl;
      const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;

      // If we are on production/test, we MUST use /#/ to trigger MFE's internal router
      targetUrl = isLocal
        ? `${normalizedBase}/${cleanPath}${currentSearch}`
        : `${normalizedBase}/#/${cleanPath}${currentSearch}`;
    } else if (!isLocal && !mfeBaseUrl.includes('#')) {
      // Default to adding a hash if missing in production to prevent blank pages on base URL
      targetUrl = mfeBaseUrl.endsWith('/') ? mfeBaseUrl + '#/' : mfeBaseUrl + '/#/';
    }

    console.log('[MfeContainer] Updating Iframe Src to:', targetUrl);

    // Only update if changed to prevent unnecessary reloads
    if (this.mfeUrl !== targetUrl) {
      this.mfeUrl = targetUrl;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
    }
  }
}

