import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="height: 100%; width: 100%; border: none; background: #fff;">
      <iframe *ngIf="safeUrl" 
              [src]="safeUrl" 
              style="width: 100%; height: 100%; border: none;"
              frameborder="0">
      </iframe>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
  `]
})
export class LoginContainerComponent implements OnInit {
  safeUrl: SafeResourceUrl | null = null;
  mfeUrl: string = '';
  baseUrl = 'https://dev.fovestta.com/Auth/dist';

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
  }

  private updateIframeSrc() {
    const shellBase = '/Gateway/dist';
    const path = window.location.pathname;
    const search = window.location.search;

    // Remove shell base from the current path to get the relative route
    let relativePath = path;
    if (path.startsWith(shellBase)) {
      relativePath = path.substring(shellBase.length);
    }

    // Default to /login if we are at the root
    const targetPath = (relativePath === '/' || relativePath === '') ? '/login' : relativePath;

    // Ensure baseUrl ends without a slash and targetPath starts with one
    const normalizedBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const normalizedPath = targetPath.startsWith('/') ? targetPath : '/' + targetPath;

    const fullUrl = normalizedBase + normalizedPath + search;

    // Only update if changed to prevent unnecessary reloads
    if (this.mfeUrl !== fullUrl) {
      console.log('Shell LoginContainer updating iframe target:', fullUrl);
      this.mfeUrl = fullUrl;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    }
  }
}
