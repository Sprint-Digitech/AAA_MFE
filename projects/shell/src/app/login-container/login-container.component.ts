import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="height: 100%; width: 100%; border: none; background: #fff;">
      <iframe #loginIframe
              *ngIf="safeUrl" 
              [src]="safeUrl" 
              style="width: 100%; height: 100%; border: none;"
              frameborder="0"
              (load)="onIframeLoad()">
      </iframe>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
  `]
})
export class LoginContainerComponent implements OnInit {
  @ViewChild('loginIframe') loginIframe!: ElementRef<HTMLIFrameElement>;
  safeUrl: SafeResourceUrl | null = null;
  mfeUrl: string = '';
  baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:4204' : 'https://test.fovestta.com/Auth/dist';

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    console.log('Shell LoginContainer booting...');

    // Subscribe to URL changes so when we move between /login, /register, etc. 
    // the iframe updates its src and shows the correct MFE page.
    this.route.url.subscribe(() => {
      this.updateIframeSrc();
    });

    // Listen for requests from the MFE
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'REQUEST_TOKEN') {
        this.sendTokenToMfe();
      }
    });
  }

  onIframeLoad() {
    console.log('Shell LoginContainer: Iframe loaded, sending token...');
    setTimeout(() => this.sendTokenToMfe(), 500);
  }

  private sendTokenToMfe() {
    if (this.loginIframe && this.loginIframe.nativeElement.contentWindow) {
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
          console.warn('[LoginContainer] Failed to parse user from session storage', e);
        }

        this.loginIframe.nativeElement.contentWindow.postMessage({
          type: 'SET_TOKEN',
          token: parsedToken,
          user: parsedUser,
          tenantSchema: tenantSchema
        }, '*');
      }
    }
  }

  private updateIframeSrc() {
    const isLocal = window.location.hostname === 'localhost';
    const shellBase = '/Gateway/dist';

    // In Hash mode, the route is easily obtained from this.router.url
    // but here we can also just use the relative path calculated before.
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    let relativePath = '';
    if (path.startsWith(shellBase)) {
      relativePath = path.substring(shellBase.length);
    }

    // In standard deployment, the shell is at /Gateway/dist/
    // If the path is just that, the actual route is in the hash
    if (hash.startsWith('#/')) {
      relativePath = hash.substring(1).split('?')[0];
    }

    const targetPath = (relativePath === '/' || relativePath === '' || relativePath === '/index.html') ? '/login' : relativePath;

    // Safety check: Remove production folder name
    let cleanPath = targetPath;
    const folderSegments = ['/auth/dist', '/salary/dist', '/employee/dist', '/alms/dist', '/notification/dist'];
    const lowerClean = cleanPath.toLowerCase();
    for (const segment of folderSegments) {
      if (lowerClean.startsWith(segment)) {
        cleanPath = cleanPath.substring(segment.length);
        break;
      }
    }

    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    const normalizedBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;

    // In production, we point to the folder and use the hash for the route
    // e.g. https://.../Auth/dist/#/login
    const fullUrl = isLocal
      ? `${normalizedBase}/${cleanPath}${search}`
      : `${normalizedBase}/#/${cleanPath}${search}`;

    if (this.mfeUrl !== fullUrl) {
      console.log('Shell LoginContainer updating iframe target:', fullUrl);
      this.mfeUrl = fullUrl;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    }
  }
}

