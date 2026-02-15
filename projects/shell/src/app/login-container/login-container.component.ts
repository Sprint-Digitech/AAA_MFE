import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="height: 100%; width: 100%; border: none; background: #fff;">
      <div style="padding: 10px; background: #e74c3c; color: white;">
        Login Container Diagnostic: Attempting to load {{ baseUrl }}
      </div>
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
  baseUrl = 'http://localhost:4204';

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    console.log('Shell LoginContainer booting for iframe...');
    const path = window.location.pathname;
    const search = window.location.search;

    // Safety check: if we are at root, load login
    const targetPath = (path === '/' || path === '') ? '/login' : path;
    const fullUrl = this.baseUrl + targetPath + search;

    console.log('Shell LoginContainer targeting:', fullUrl);
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }
}
