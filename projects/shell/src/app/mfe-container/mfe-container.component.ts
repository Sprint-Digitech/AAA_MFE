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
      this.updateIframeSrc();
    });

    // Subscribe to URL changes (handles navigation within the same MFE)
    this.route.url.subscribe(() => {
      const data = this.route.snapshot.data;
      const isExternalApp = data['isExternalApp'] || false;

      // ✅ Inventory ke liye URL change subscribe skip karo
      if (isExternalApp) return;

      const mfeBaseUrl = data['mfeUrl'] || 'http://localhost:4200';
      this.updateIframeSrc();
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

  // private updateIframeSrc(mfeBaseUrl: string) {
  //   this.route.url.subscribe(() => {
  //     this.updateIframeSrc();
  //   });
  // }

  private updateIframeSrc() {
    const isLocal = window.location.hostname === 'localhost';
    const shellBase = '/Gateway/dist';
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const currentSearch = window.location.search;

    const authMfeBasePath = isLocal ? 'http://localhost:4204' : 'https://test.fovestta.com/Auth/dist';
    const salaryMfeBasePath = isLocal ? 'http://localhost:4206' : 'https://test.fovestta.com/Salary/dist';
    const almsMfeBasePath = isLocal ? 'http://localhost:4205' : 'https://test.fovestta.com/ALMS/dist';
    const employeeMfeBasePath = isLocal ? 'http://localhost:4207' : 'https://test.fovestta.com/Employee/dist';
    const notificationMfeBasePath = isLocal ? 'http://localhost:4208' : 'https://test.fovestta.com/Notification/dist';

    let relativePath = '';
    // Priority 1: Check hash for route (this is what is changed during nav)
    if (currentHash.startsWith('#/')) {
      relativePath = currentHash.substring(1).split('?')[0];
    } else if (currentPath.startsWith(shellBase)) {
      relativePath = currentPath.substring(shellBase.length);
    }

    const path = relativePath.toLowerCase();
    let mfeBaseUrl = '';

    const segments = relativePath.split('/').filter(s => s);
    const primaryPath = segments.length > 0 ? segments[0].split('?')[0].toLowerCase() : '';
    const secondaryPath = segments.length > 1 ? segments[1].split('?')[0].toLowerCase() : '';

    const salaryModules = [
      'bonus', 'reimbursement', 'access', 'gratuity', 'arrear',
      'salary', 'loan', 'reports', 'master', 'utility',
      'payroll', 'settings', 'currency', 'department', 'location',
      'designation', 'welcome-user', 'home', 'tracing', 'tax',
      'tds', 'perquisites', 'investment'
    ];
    const salaryEmployeeSubPaths = [
      'employeeannualbonus', 'employeectc', 'addemployeectc',
      'updateemployeectc', 'employeectcdetails', 'ctcemployee',
      'employeetdslist', 'employeevpf', 'addemployeevpf', 'updateemployeevpf',
      'employeepf', 'addemployeepf', 'updateemployeepf',
      'addemployeectcdetails', 'updateemployeectcdetails', 'appraisel-letter',
      'employeeattendance', 'addemployeeattendancebysheet'
    ];
    const salaryAttendanceSubPaths = ['holiday-master', 'add-holiday', 'edit-holiday', 'bulk-upload-holiday'];

    const almsModules = ['alms', 'ess', 'attendance', 'employeeselfservice'];
    const almsEmployeeSubPaths = ['employeebiometric'];

    // Route Mapping Logic
    if (
      salaryModules.includes(primaryPath) ||
      (primaryPath === 'employee' && salaryEmployeeSubPaths.includes(secondaryPath)) ||
      (primaryPath === 'attendance' && salaryAttendanceSubPaths.includes(secondaryPath)) ||
      (primaryPath === 'employeeselfservice' && secondaryPath === 'salary&tax') ||
      (primaryPath === 'employeeselfservice' && secondaryPath === 'tds')
    ) {
      mfeBaseUrl = salaryMfeBasePath;
    } else if (
      almsModules.includes(primaryPath) ||
      (primaryPath === 'employee' && almsEmployeeSubPaths.includes(secondaryPath))
    ) {
      mfeBaseUrl = almsMfeBasePath;
    } else if (primaryPath === 'notification') {
      mfeBaseUrl = notificationMfeBasePath;
    } else if (primaryPath === 'employee') {
      mfeBaseUrl = employeeMfeBasePath;
    } else {
      mfeBaseUrl = authMfeBasePath;
    }

    const normalizedBase = mfeBaseUrl.endsWith('/') ? mfeBaseUrl.slice(0, -1) : mfeBaseUrl;

    let cleanPath = relativePath;
    const pathLower = cleanPath.toLowerCase();

    // Strip redundant folder segments from the path before appending to MFE base
    const folderSegments = ['/auth/dist', '/salary/dist', '/employee/dist', '/alms/dist', '/notification/dist'];

    for (const segment of folderSegments) {
      if (pathLower.startsWith(segment)) {
        cleanPath = cleanPath.substring(segment.length);
        break;
      }
    }

    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    // If we have a path, append it to the hash to maintain MFE internal routing
    const targetUrl = isLocal
      ? `${normalizedBase}/${cleanPath}${currentSearch}`
      : (cleanPath ? `${normalizedBase}/#/${cleanPath}${currentSearch}` : `${normalizedBase}/${currentSearch}`);

    console.log('[Shell][MfeContainer] Updating Iframe Src to:', targetUrl);

    if (this.mfeUrl !== targetUrl) {
      this.mfeUrl = targetUrl;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
    }
  }
}
