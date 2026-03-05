import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-mfe-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="height: 100%; width: 100%; border: none; overflow: hidden;">
      <iframe *ngIf="safeUrl" 
              [src]="safeUrl" 
              style="width: 100%; height: 100%; border: none;"
              frameborder="0">
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
  safeUrl: SafeResourceUrl | null = null;
  mfeUrl: string = '';

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    // Subscribe to route data changes (handles MFE switches)
    this.route.data.subscribe(data => {
      const mfeBaseUrl = data['mfeUrl'] || 'http://localhost:4200';
      const isExternalApp = data['isExternalApp'] || false;

      // ✅ Inventory (Next.js) — iframe nahi, seedha redirect
      if (isExternalApp) {
        this.redirectToExternalApp(mfeBaseUrl);
        return;
      }

      console.log('[Shell][MfeContainer] Route data changed, Base URL:', mfeBaseUrl);
      this.updateIframeSrc(mfeBaseUrl);
    });

    // Subscribe to URL changes (handles navigation within the same MFE)
    this.route.url.subscribe(() => {
      const data = this.route.snapshot.data;
      const isExternalApp = data['isExternalApp'] || false;

      // ✅ Inventory ke liye URL change subscribe skip karo
      if (isExternalApp) return;

      const mfeBaseUrl = data['mfeUrl'] || 'http://localhost:4200';
      this.updateIframeSrc(mfeBaseUrl);
    });
  }

  // ✅ Inventory Next.js app ke liye — seedha window redirect
  private redirectToExternalApp(mfeBaseUrl: string) {
    const shellBase = '/Gateway/dist';
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    // Shell base path hata do
    let relativePath = currentPath;
    if (currentPath.startsWith(shellBase)) {
      relativePath = currentPath.substring(shellBase.length);
    }

    const normalizedBase = mfeBaseUrl.endsWith('/')
      ? mfeBaseUrl.slice(0, -1)
      : mfeBaseUrl;

    const normalizedPath = relativePath.startsWith('/')
      ? relativePath
      : '/' + relativePath;

    const targetUrl = normalizedBase + normalizedPath + currentSearch;

    console.log('[Shell][MfeContainer] Redirecting to External App:', targetUrl);

    // Seedha redirect — iframe nahi
    window.location.href = targetUrl;
  }

  // ngOnInit() {
  //   // Subscribe to route data changes (handles MFE switches)
  //   this.route.data.subscribe(data => {
  //     const mfeBaseUrl = data['mfeUrl'] || 'http://localhost:4200';
  //     console.log('[Shell][MfeContainer] Route data changed, Base URL:', mfeBaseUrl);
  //     this.updateIframeSrc(mfeBaseUrl);
  //   });

  //   // Subscribe to URL changes (handles navigation within the same MFE)
  //   this.route.url.subscribe(() => {
  //     const mfeBaseUrl = this.route.snapshot.data['mfeUrl'] || 'http://localhost:4200';
  //     this.updateIframeSrc(mfeBaseUrl);
  //   });
  // }

  private updateIframeSrc(mfeBaseUrl: string) {
    const shellBase = '/Gateway/dist';
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    let targetUrl = mfeBaseUrl;

    // Remove shell base from the current path
    let relativePath = currentPath;
    if (currentPath.startsWith(shellBase)) {
      relativePath = currentPath.substring(shellBase.length);
    }

    // Only append path if we are NOT at shell root or dashboard
    if (relativePath && relativePath !== '/' && relativePath !== '/dashboard') {
      const normalizedBase = mfeBaseUrl.endsWith('/') ? mfeBaseUrl.slice(0, -1) : mfeBaseUrl;
      const normalizedPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      targetUrl = normalizedBase + normalizedPath + currentSearch;
    }

    console.log('[Shell][MfeContainer] Updating Iframe Src to:', targetUrl);

    // Only update if changed to prevent unnecessary reloads
    if (this.mfeUrl !== targetUrl) {
      this.mfeUrl = targetUrl;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
    }
  }
}
