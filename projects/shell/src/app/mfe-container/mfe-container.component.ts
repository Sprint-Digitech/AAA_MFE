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
    const mfeBaseUrl = this.route.snapshot.data['mfeUrl'] || 'http://localhost:4200';
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    let targetUrl = mfeBaseUrl;

    // Only append the path if it's NOT the dashboard of the shell itself
    // We want to pass the deep path (e.g. /employee/dashboardOnboarding) to the MFE
    if (currentPath && currentPath !== '/' && currentPath !== '/dashboard') {
      const normalizedBase = mfeBaseUrl.endsWith('/') ? mfeBaseUrl.slice(0, -1) : mfeBaseUrl;
      const normalizedPath = currentPath.startsWith('/') ? currentPath : '/' + currentPath;
      targetUrl = normalizedBase + normalizedPath + currentSearch;
    }

    console.log('[Shell][MfeContainer] Loading Path:', currentPath);
    console.log('[Shell][MfeContainer] Target MFE:', targetUrl);

    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
    this.mfeUrl = targetUrl;
  }
}
