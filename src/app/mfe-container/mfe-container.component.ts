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

  private updateIframeSrc(mfeBaseUrl: string) {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    let targetUrl = mfeBaseUrl;

    // Define potential shell bases to strip
    const shellBases = ['/Gateway/dist', '/Auth/dist'];
    let relativePath = currentPath;

    for (const base of shellBases) {
      if (currentPath.startsWith(base)) {
        relativePath = currentPath.substring(base.length);
        break;
      }
    }

    if (relativePath && relativePath !== '/' && relativePath !== '/dashboard') {
      const normalizedBase = mfeBaseUrl.endsWith('/') ? mfeBaseUrl.slice(0, -1) : mfeBaseUrl;
      const normalizedPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      targetUrl = normalizedBase + normalizedPath + currentSearch;
    }

    console.log('[MfeContainer] Updating Iframe Src to:', targetUrl);

    // Only update if changed to prevent unnecessary reloads (though in this case we want reloads on nav)
    if (this.mfeUrl !== targetUrl) {
      this.mfeUrl = targetUrl;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
    }
  }
}
