import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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
export class MfeContainerComponent implements OnInit, OnDestroy {
  safeUrl: SafeResourceUrl | null = null;
  mfeUrl: string = '';

  private subscription = new Subscription();

  constructor(private route: ActivatedRoute, private router: Router, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    // Handle the initial load of this component.
    this.handleNavigation();

    // Angular reuses this component instance across sibling menu clicks that resolve
    // through the same matcher-based '**' child route (e.g. Salary/ALMS matchers in
    // app.routes.ts consume every segment, so ActivatedRoute.url/.data stop emitting
    // after the first activation). Router.events -> NavigationEnd fires on every
    // completed navigation regardless of route reuse, so use that instead to make sure
    // the iframe src is recomputed on every menu click.
    this.subscription.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => this.handleNavigation())
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private handleNavigation() {
    const data = this.route.snapshot.data;
    const mfeBaseUrl = data['mfeUrl'] || 'http://localhost:4200';
    const isExternalApp = data['isExternalApp'] || false;

    // ✅ Inventory (Next.js) — iframe nahi, seedha redirect
    if (isExternalApp) {
      this.redirectToExternalApp(mfeBaseUrl);
      return;
    }

    this.updateIframeSrc();
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

  private updateIframeSrc() {
    const isLocal = window.location.hostname === 'localhost';
    const shellBase = '/Gateway/dist';
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const currentSearch = window.location.search;

    const authMfeBasePath = isLocal ? 'http://localhost:4204' : 'https://attendance.bubnaadvertising.com/Auth/dist';
    const salaryMfeBasePath = isLocal ? 'http://localhost:4206' : 'https://attendance.bubnaadvertising.com/Salary/dist';
    const almsMfeBasePath = isLocal ? 'http://localhost:4205' : 'https://attendance.bubnaadvertising.com/ALMS/dist';
    const employeeMfeBasePath = isLocal ? 'http://localhost:4207' : 'https://attendance.bubnaadvertising.com/Employee/dist';
    const notificationMfeBasePath = isLocal ? 'http://localhost:4208' : 'https://attendance.bubnaadvertising.com/Notification/dist';
    const progressTrackerMfeBasePath = isLocal ? 'http://localhost:4204' : 'https://attendance.bubnaadvertising.com/ProgressTracker/dist';

    let relativePath = '';
    let hashSearch = '';

    // Priority 1: Check hash for route (this is what is changed during nav)
    if (currentHash.startsWith('#/')) {
      const hashParts = currentHash.substring(1).split('?');
      relativePath = hashParts[0];
      if (hashParts.length > 1) {
        hashSearch = '?' + hashParts[1];
      }
    } else if (currentPath.startsWith(shellBase)) {
      relativePath = currentPath.substring(shellBase.length);
    }

    const effectiveSearch = currentSearch || hashSearch;

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
    
    const progressTrackerModules = ['progress-tracker', 'dashboard', 'tasks', 'projects', 'kpi', 'goals', 'reviews'];

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
    } else if (progressTrackerModules.includes(primaryPath)) {
      mfeBaseUrl = progressTrackerMfeBasePath;
    } else {
      mfeBaseUrl = authMfeBasePath;
    }

    const normalizedBase = mfeBaseUrl.endsWith('/') ? mfeBaseUrl.slice(0, -1) : mfeBaseUrl;

    let cleanPath = relativePath;
    const pathLower = cleanPath.toLowerCase();

    // Strip redundant folder segments from the path before appending to MFE base
    const folderSegments = ['/auth/dist', '/salary/dist', '/employee/dist', '/alms/dist', '/notification/dist', '/progresstracker/dist'];

    for (const segment of folderSegments) {
      if (pathLower.startsWith(segment)) {
        cleanPath = cleanPath.substring(segment.length);
        break;
      }
    }

    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    // If we have a path, append it to the hash to maintain MFE internal routing
    const targetUrl = isLocal
      ? `${normalizedBase}/${cleanPath}${effectiveSearch}`
      : (cleanPath ? `${normalizedBase}/#/${cleanPath}${effectiveSearch}` : `${normalizedBase}/${effectiveSearch}`);

    console.log('[Shell][MfeContainer] Updating Iframe Src to:', targetUrl);

    if (this.mfeUrl !== targetUrl) {
      this.mfeUrl = targetUrl;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
    }
  }
}
