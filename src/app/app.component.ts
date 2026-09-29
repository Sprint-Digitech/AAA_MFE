import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { GlobalSearchService } from './shared/services/global-search.service';
import { EmployeeService } from './shared/services/employee.service';
import { AccountService } from './shared/services/account.service';
import { LoaderComponent } from './loader/loader/loader.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiAgentComponent } from './ai-agent/ai-agent.component';
import { CompanySwitcherComponent } from './shared/components/company-switcher/company-switcher.component';
import { CompanySwitcherService } from './shared/services/company-switcher.service';
import { RepositoryService } from './shared/services/repository.service';
import { NotificationBellComponent } from './shared/components/notification-bell/notification-bell.component';
import { ChatIconComponent, ChatWidgetConfig, EmployeeContact } from '@fovestta2/chat-widget-fovestta';
import { EnvironmentUrlService } from './shared/services/environment-url.service';
import { SecureTokenStorageService } from './shared/services/secure-token-storage.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    LoaderComponent,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    AiAgentComponent,
    CompanySwitcherComponent,
    NotificationBellComponent,
    ChatIconComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private menuSub?: Subscription;
  title = 'login';
  isLoginPage = true;
  isExpanded = true;
  isSidebarCollapsed = false; // Add compatibility for my existing toggle if needed
  openSubmenus: Set<string> = new Set();
  menus: any[] = [];
  user: any = null;
  currentSubmenuTop = 0;
  companies: string = '';
  companyName: any;
  readonly defaultSidebarLogo = 'assets/img/fovesta1.png';
  // Search functionality
  globalSearchTerm = '';
  isGlobalSearchOpen = false;
  globalEmployeeResults: any[] = [];
  isSearchingEmployees = false;

  // User dropdown
  showUserDropdown = false;
  signoutHover = false;

  // Change password
  showChangePassword = false;
  changePasswordLoading = false;
  changePasswordError = '';
  changePasswordSuccess = '';
  cpForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

  // User details
  private readonly emptyUserDetails = {
    name: '',
    email: '',
    role: '',
    department: '',
    designation: '',
  };
  userDetails = { ...this.emptyUserDetails };

  // Chat widget - see ChatWidgetConfig in @fovestta2/chat-widget-fovestta for why
  // this is plain callbacks rather than passing our own services into the lib.
  chatConfig: ChatWidgetConfig | null = null;
  chatContacts: EmployeeContact[] = [];


  menuIcons: { [key: string]: string } = {
    Employee: 'badge',
    Reports: 'add_chart',
    Settings: 'settings',
    Loan: 'account_balance_wallet',
    Loans: 'account_balance_wallet',
    Salary: 'currency_rupee',
    Reimbursement: 'savings',
    ALMS: 'calendar_month',
    Bonus: 'emoji_events',
    Master: 'grid_view',
    'ESS Portal': 'man_4',
    Gratuity: 'work_history',
    Arrear: 'history',
    Dashboard: 'dashboard',
    'Go to Progress': 'speed'
  };

  constructor(private router: Router,
    private cdr: ChangeDetectorRef,
    private globalSearchService: GlobalSearchService,
    private employeeService: EmployeeService,
    private CompanyData: RepositoryService,
    private accountService: AccountService,
    private http: HttpClient,
    private companySwitcherService: CompanySwitcherService,
    private environmentUrlService: EnvironmentUrlService,
    private secureTokenStorageService: SecureTokenStorageService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      console.log('AppComponent: URL Changed to', url);
      this.isLoginPage = url === '/login' || url === '/' || url === '' || url === '/register' || url.includes('forgot-password') || url.includes('login-inventory') || url === '/register-inventory' || url.includes('sku-management') ||
        url.includes('product-master') ||
        url.includes('bin-management') ||
        url.includes('grn') ||
        url.includes('pick-pack') ||
        url.includes('returns') ||
        url.includes('marketplace-mapping') ||
        url.includes('inventory-dashboard') ||
        url.includes('reports') || url.includes('settings');
      console.log('AppComponent: isLoginPage =', this.isLoginPage);
      const authPaths = ['/login-inventory', '/login', '/register', '/forgot-password', '/reset', '/welcome', '/authentication'];
      const isAuthRoute = authPaths.some(p => url === p || url.startsWith(p + '?') || url.startsWith(p + '/')) || url === '/' || url === '';

      // Hide internal nav if it's a login page OR if we are inside the Shell iframe
      this.isLoginPage = isAuthRoute || (window !== window.parent);

      console.log('AppComponent: isLoginPage =', this.isLoginPage, '(Auth Route:', isAuthRoute, 'Inside Iframe:', window !== window.parent, ')');

      // Keep shell URL perfectly in sync to fix refresh redirects
      if (window !== window.parent) {
        window.parent.postMessage({ type: 'ROUTER_NAVIGATED', url: url }, '*');
      }
      this.loadUserData();

      this.globalSearchTerm = '';
      this.isGlobalSearchOpen = false;
      this.globalEmployeeResults = [];
      this.globalSearchService.emit('');
    });
  }

  ngOnInit() {
    // Listen for messages from parent shell (sync token/user)
    window.addEventListener('message', (event) => {
      if (!event.data) return;

      if (event.data.type === 'SET_TOKEN') {
        const { token, user, tenantSchema } = event.data;
        if (token) {
          console.log('[LOGIN_MFE] Received token from parent shell');
          sessionStorage.setItem('token', typeof token === 'string' ? token : JSON.stringify(token));
        }
        if (user) {
          sessionStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
        }
        if (tenantSchema) {
          sessionStorage.setItem('tenantSchema', tenantSchema);
        }
        this.loadUserData();
        this.cdr.detectChanges();
      }

      if (event.data.type === 'DOCUMENT_CLICKED') {
        console.log('[LOGIN_MFE] Received DOCUMENT_CLICKED from iframe');
        this.closeSubmenus();
        this.showUserDropdown = false;
        this.isGlobalSearchOpen = false;
        this.cdr.detectChanges();
      }

      if (event.data.type === 'GLOBAL_SEARCH') {
        console.log('[LOGIN_MFE] Received GLOBAL_SEARCH:', event.data.term);
        this.globalSearchService.emit(event.data.term);
        this.cdr.detectChanges();
      }

      if (event.data.type === 'COMPANY_SWITCHED' && event.data.company) {
        console.log('[LOGIN_MFE] Received COMPANY_SWITCHED:', event.data.company);
        this.companySwitcherService.applyExternal(event.data.company);
        this.cdr.detectChanges();
      }

      if (event.data.type === 'REQUEST_ACTIVE_COMPANY') {
        const active = this.companySwitcherService.active;
        if (active && event.source) {
          (event.source as Window).postMessage({ type: 'COMPANY_SWITCHED', company: active }, '*' as any);
        }
      }

      // Embedded MFEs (Employee_MFE etc.) navigate internally via their own hash router without
      // ever changing this shell's URL, so this.router.events (NavigationEnd) never fires for
      // those transitions and the header search box was left showing the last-typed term no
      // matter how far the user navigated inside the iframe. Each MFE already posts
      // ROUTER_NAVIGATED on its own route changes (see Employee_MFE's app.component.ts) — piggyback
      // on that to clear the search here too, same as the shell's own NavigationEnd handler does.
      if (event.data.type === 'ROUTER_NAVIGATED') {
        this.globalSearchTerm = '';
        this.isGlobalSearchOpen = false;
        this.globalEmployeeResults = [];
        this.globalSearchService.emit('');
        this.cdr.markForCheck();
      }
    });

    // Request token from parent on load if in an iframe
    if (window !== window.parent) {
      window.parent.postMessage({ type: 'REQUEST_TOKEN' }, '*');
    }

    this.loadUserData();
    this.hydrateUserDetailsFromSession();
    this.initChatWidget();
    // Restore cached logo immediately so there's no flash on page refresh
    const cachedLogo = sessionStorage.getItem('companyLogo');
    if (cachedLogo) { this.companies = cachedLogo; }
    this.getCompanies();

    // Subscribe to menu data so sidebar updates whenever menus change
    this.menuSub = this.accountService.menuData$.subscribe((menus) => {
      this.menus = menus || [];
      this.cdr.markForCheck();
    });

    // Re-fetch menus from API on startup so stale sessionStorage doesn't persist after role changes
    this.accountService.reloadMenuData().subscribe();

    if (window !== window.parent) {
      document.body.classList.add('is-iframe');
    }

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'LOGOUT') {
        this.logout(false);
      }
    });
  }

  ngOnDestroy() {
    this.menuSub?.unsubscribe();
  }


  loadUserData() {
    const storedMenus = sessionStorage.getItem('menus');
    const storedUser = sessionStorage.getItem('user');
    if (storedMenus) {
      this.menus = JSON.parse(storedMenus);
    }

    if (this.menus && !this.menus.find(m => m.menuDisplayName === 'Go to Progress')) {
      this.menus.splice(1, 0, {
        menuDisplayName: 'Go to Progress',
        menuPath: '', // Empty path as it opens externally
        submenu: null
      });
    }

    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.setUserDetails(this.user);
      this.syncCompanyBrandingFromUser(this.user);
    }
  }
  get userInitials(): string {
    const source = (this.userDetails.name || '').trim();
    if (!source) {
      return '?';
    }
    const parts = source.split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return '?';
    }
    const firstInitial = parts[0]?.charAt(0) ?? '';
    const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? '' : '';
    const initials = `${firstInitial}${lastInitial}`.trim() || firstInitial;
    return initials.toUpperCase() || '?';
  }

  // Search functionality
  async onGlobalSearch(): Promise<void> {
    return; // ← bas yahi rakho
  }
  onHeaderInput(value: string): void {
    this.globalSearchTerm = value;
    const term = value.trim();
    this.globalSearchService.emit(term);

    // Send search to all MFE iframes
    document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
      iframe.contentWindow?.postMessage({ type: 'GLOBAL_SEARCH', term }, '*');
    });

    this.isGlobalSearchOpen = false;
    this.globalEmployeeResults = [];
    this.isSearchingEmployees = false;
    this.cdr.markForCheck();
  }

  openGlobalSearchResults(): void {
    return; // ← bas yahi rakho
  }

  closeGlobalSearch(): void {
    this.isGlobalSearchOpen = false;
  }

  clearGlobalSearch(): void {
    this.globalSearchTerm = '';
    this.globalEmployeeResults = [];
    this.isGlobalSearchOpen = false;
    this.globalSearchService.emit('');

    // Also clear the search inside embedded MFE iframes, otherwise their
    // filtered dataset stays stuck on the last typed term.
    document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
      iframe.contentWindow?.postMessage({ type: 'GLOBAL_SEARCH', term: '' }, '*');
    });
  }

  navigateToEmployee(employee: any): void {
    if (!employee) return;

    const normalized = this.normalizeEmployee(employee);
    const employeeId = normalized.employeeId;

    if (employeeId) {
      this.router.navigate(['/employee/employee-profile', employeeId], {
        queryParams: { search: this.globalSearchTerm.trim() },
      });
    }

    this.isGlobalSearchOpen = false;
    this.globalEmployeeResults = [];
    this.globalSearchTerm = '';
    this.globalSearchService.emit('');
    document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
      iframe.contentWindow?.postMessage({ type: 'GLOBAL_SEARCH', term: '' }, '*');
    });
    this.cdr.markForCheck();
  }

  private initChatWidget(): void {
    this.chatConfig = {
      chatBaseUrl: this.environmentUrlService.chatUrlAddress,
      getAccessToken: () => this.secureTokenStorageService.getToken(),
      getTenantSchema: () => sessionStorage.getItem('tenantSchema') || 'dbo',
      getCurrentEmployeeId: () => this.resolveChatEmployeeId(),
    };

    // Best-effort "start new chat" contact list - a failed/slow fetch shouldn't
    // block chat from working for existing conversations, only the picker.
    // Hits Employee_Services directly (essUrlAddress), not RepositoryService.getCompany
    // - that helper only knows how to route Auth/HRMSAuthZ routes, not EmployeeMaster.
    const employeeListUrl = `${this.environmentUrlService.essUrlAddress}/api/EmployeeMaster/GetAllEmployeebasicdetails`;
    this.http.get<any[]>(employeeListUrl).subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : [];
        this.chatContacts = list.map((item: any) => {
          const normalized = this.normalizeEmployee(item);
          return {
            employeeId: normalized.employeeId,
            firstName: normalized.employeeFirstName,
            lastName: normalized.employeeLastName,
          } as EmployeeContact;
        }).filter((c: EmployeeContact) => !!c.employeeId);
      },
      error: (error) => console.error('Error fetching employee contacts for chat:', error),
    });
  }

  private resolveChatEmployeeId(): string | null {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      return parsed?.id || parsed?.employeeId || parsed?.employeId || null;
    } catch {
      return null;
    }
  }

  private normalizeEmployee(employee: any) {
    if (!employee || typeof employee !== 'object') {
      return {};
    }

    const employeeId =
      employee.employeeId ||
      employee.EmployeeId ||
      employee.id ||
      employee.employeId ||
      employee.employeeid ||
      '';

    const employeeCode =
      employee.employeeCode ||
      employee.EmployeeCode ||
      employee.code ||
      '';

    const firstName =
      employee.employeeFirstName || employee.firstName || employee.name || '';

    const middleName =
      employee.employeeMiddleName || employee.middleName || '';

    const lastName =
      employee.employeeLastName || employee.lastName || '';

    const department =
      employee.departmentName || employee.department || '';

    const designation =
      employee.designationName || employee.designation || '';

    return {
      ...employee,
      employeeId,
      employeeCode,
      employeeFirstName: firstName,
      employeeMiddleName: middleName,
      employeeLastName: lastName,
      departmentName: department,
      designationName: designation,
    };
  }

  // User dropdown functionality
  onUserClick(event: Event): void {
    event.stopPropagation();
    this.showUserDropdown = !this.showUserDropdown;
  }

  onSignoutHover(hover: boolean): void {
    this.signoutHover = hover;
    this.cdr.markForCheck();
  }

  onChangePasswordClick(): void {
    this.showChangePassword = !this.showChangePassword;
    this.changePasswordError = '';
    this.changePasswordSuccess = '';
    this.cpForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  cancelChangePassword(): void {
    this.showChangePassword = false;
    this.changePasswordError = '';
    this.changePasswordSuccess = '';
    this.cpForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  submitChangePassword(): void {
    this.changePasswordError = '';
    this.changePasswordSuccess = '';

    const { currentPassword, newPassword, confirmPassword } = this.cpForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.changePasswordError = 'All fields are required.';
      return;
    }
    if (newPassword !== confirmPassword) {
      this.changePasswordError = 'New passwords do not match.';
      return;
    }
    if (newPassword.length < 6) {
      this.changePasswordError = 'New password must be at least 6 characters.';
      return;
    }

    this.changePasswordLoading = true;
    const email = this.userDetails.email;
    const url = `${this.accountService.environment.urlAddress}/api/Account/ChangePassword`;
    this.http.post(url, { email, currentPassword, newPassword }, { responseType: 'text' }).subscribe({
      next: () => {
        this.changePasswordLoading = false;
        this.changePasswordSuccess = 'Password changed successfully.';
        this.cpForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => {
          this.showChangePassword = false;
          this.changePasswordSuccess = '';
        }, 2000);
      },
      error: (err: any) => {
        this.changePasswordLoading = false;
        const msg = err?.error || err?.message || 'Failed to change password.';
        this.changePasswordError = typeof msg === 'string' ? msg : 'Failed to change password.';
      }
    });
  }

  logout(propagate: boolean = true): void {
    console.log('Login MFE: Logout requested');

    // Close the dropdown first
    this.showUserDropdown = false;

    // Clear ALL storage
    sessionStorage.clear();
    localStorage.clear();

    // Reset all state
    this.setUserDetails(null);
    this.user = null;
    this.menus = [];
    this.globalSearchTerm = '';
    this.isGlobalSearchOpen = false;
    this.globalEmployeeResults = [];
    this.isLoginPage = true;

    // Force immediate UI update
    this.cdr.detectChanges();

    if (propagate && window !== window.parent) {
      window.parent.postMessage({ type: 'LOGOUT' }, '*');
    }

    // Always navigate to login locally as well
    this.router.navigate(['/login']);
  }
  // User details management
  private hydrateUserDetailsFromSession(): void {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      this.setUserDetails(null);
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      this.setUserDetails(parsedUser);
    } catch (error) {
      console.warn('Failed to parse user from sessionStorage', error);
      this.setUserDetails(null);
    }
  }

  private setUserDetails(userData: any | null | undefined): void {
    if (!userData || typeof userData !== 'object') {
      this.userDetails = { ...this.emptyUserDetails };
      this.cdr.markForCheck();
      return;
    }

    const displayName = this.getDisplayName(userData);
    const role = this.extractPrimaryRole(userData);
    const email = userData.email || userData.employeeEmail || userData.loginEmail || userData.userEmail || '';
    const department = userData.departmentName || userData.department || '';
    const designation = userData.designationName || userData.designation || '';

    this.userDetails = {
      name: displayName,
      email: typeof email === 'string' ? email.trim() : '',
      role: role,
      department: department,
      designation: designation,
    };

    this.syncCompanyBrandingFromUser(userData);
    this.cdr.markForCheck();
  }

  private syncCompanyBrandingFromUser(userData: any | null | undefined): void {
    if (!userData || typeof userData !== 'object') {
      return;
    }

    const companyName = this.extractCompanyName(userData);
    if (companyName) {
      this.companyName = companyName;
    }
  }

  private extractCompanyName(userData: any): string {
    const candidates = [
      userData.companyName,
      userData.CompanyName,
      userData.company?.companyName,
      userData.company?.CompanyName,
      userData.employee?.companyName,
      userData.employee?.CompanyName,
      userData.employee?.company?.companyName,
      userData.employee?.company?.CompanyName,
    ];

    const companyName = candidates.find((value: unknown) => typeof value === 'string' && value.trim());
    return typeof companyName === 'string' ? companyName.trim() : '';
  }

  private getDisplayName(userData: any): string {
    const nameParts = [
      userData.firstName || userData.employeeFirstName || userData.employeeName || '',
      userData.middleName || userData.employeeMiddleName || '',
      userData.lastName || userData.employeeLastName || '',
    ]
      .map((part: string) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);

    if (nameParts.length) {
      return nameParts.join(' ');
    }

    const fallback = userData.displayName || userData.userName || userData.email || userData.loginname || '';
    return typeof fallback === 'string' ? fallback.trim() : '';
  }

  private extractPrimaryRole(userData: any): string {
    const roles = Array.isArray(userData?.employeeRoleLoginDtos) ? userData.employeeRoleLoginDtos : [];
    const primaryRole = roles.find((role: any) => role?.isPrimary) || roles[0] || null;
    const roleName = primaryRole?.roleName || primaryRole?.roleDescription || primaryRole?.name || userData.roleName || userData.role || '';
    return typeof roleName === 'string' ? roleName.trim() : '';
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    this.isSidebarCollapsed = !this.isExpanded;
    if (!this.isExpanded) {
      this.openSubmenus.clear();
    }
  }

  onMenuClick(event: Event, menu: any) {
    event.stopPropagation();
    if (!this.isExpanded) {
      this.isExpanded = true;
      this.isSidebarCollapsed = false;
    }

    if (menu.menuDisplayName === 'Go to Progress') {
      event.preventDefault();
      const isLocal = window.location.hostname === 'localhost';
      // const progressMfe = isLocal ? 'http://localhost:4205' : 'https://test.fovestta.com/ProgressTracker/dist';
      const progressMfe = isLocal ? 'http://localhost:4205' : 'https://localhost:7274/auth/sdapi/api/Account/Login';
      let url = `${progressMfe}/#/dashboard/employee`;
      const token = sessionStorage.getItem('token');
      if (token) {
        let parsedToken = token;
        if (token.startsWith('{')) {
          parsedToken = JSON.parse(token);
        } else if (token.startsWith('"') && token.endsWith('"')) {
          parsedToken = token.substring(1, token.length - 1);
        }
        url += `?token=${parsedToken}`;
      }
      url += `&userName=${encodeURIComponent(this.userDetails.name || '')}`;
      url += `&userRole=${encodeURIComponent(this.userDetails.role || '')}`;
      url += `&userEmail=${encodeURIComponent(this.userDetails.email || '')}`;

      const normalizedUser = this.normalizeEmployee(this.user);
      const employeeId = normalizedUser.employeeId || this.user?.userId || '';
      url += `&employeeId=${encodeURIComponent(employeeId)}`;

      window.open(url, '_blank');
      return;
    }

    if (menu.submenu && menu.submenu.length > 0) {
      event.preventDefault();
      const menuId = menu.menuDisplayName;

      const wasOpen = this.isSubmenuOpen(menuId);
      this.openSubmenus.clear();
      if (!wasOpen) {
        this.openSubmenus.add(menuId);

        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        // Use direct property binding (subtracting 12px for internal padding alignment)
        this.currentSubmenuTop = rect.top - 12;
      }
    } else {
      this.openSubmenus.clear();
    }
  }

  onMainContainerClick(): void {
    this.closeSubmenus();
    this.showUserDropdown = false;
  }

  closeSubmenus() {
    this.openSubmenus.clear();
  }

  // Close submenu on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-item') && !target.closest('.submenu')) {
      this.openSubmenus.clear();
    }
    // Close search results
    if (!target.closest('.search-box')) {
      this.closeGlobalSearch();
    }
    // Close user dropdown if clicking outside
    if (!target.closest('.user-profile') && !target.closest('.user-profile-dropdown')) {
      this.showUserDropdown = false;
      this.showChangePassword = false;
    }
  }

  isSubmenuOpen(menuId: string): boolean {
    return this.openSubmenus.has(menuId);
  }

  hasSubmenu(menu: any): boolean {
    return menu.submenu && menu.submenu.length > 0;
  }

  getIcon(menuName: string): string {
    return this.menuIcons[menuName] || 'list';
  }
  // Company Logo Methods
  get sidebarLogo(): string {
    return this.companies || this.defaultSidebarLogo;
  }

  get sidebarLogoAlt(): string {
    return this.companyName ? `${this.companyName} logo` : 'Fovesta Logo';
  }
  getCompanies = () => {
    // GetCompany with no id returns every company in the tenant's group so this can
    // pick the first one - previously expensive (~1.7MB/5-9s) because Companylogo held
    // a full base64 blob per company; briefly routed through the my-companies endpoint
    // instead to work around that, but that only returns companies a user has an
    // explicit role assignment for, so it silently broke the header logo for ordinary
    // employees without one. Now that Companylogo is a short URL (HRMSAuthZ backfilled
    // + writes files instead of embedding blobs), GetCompany is cheap again and works
    // for every logged-in user, admin or not - reverted to it.
    this.CompanyData.getCompany('api/company-branch/GetCompany').subscribe({
      next: (data: any) => {
        const companyRecord = Array.isArray(data)
          ? data.find((item: any) => item?.companyName || item?.CompanyName || item?.companylogo || item?.CompanyLogo)
          : null;
        const logo = companyRecord?.companyLogo || companyRecord?.companylogo || companyRecord?.CompanyLogo;
        this.companies = this.resolveCompanyLogo(logo);
        // Cache so next page load shows the right logo immediately without a flash
        if (this.companies) { sessionStorage.setItem('companyLogo', this.companies); }
        this.companyName =
          companyRecord?.companyName ||
          companyRecord?.CompanyName ||
          this.extractCompanyName(this.user) ||
          this.companyName;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching company data:', error);
      }
    });
  };

  private resolveCompanyLogo(logo: string | null | undefined): string {
    if (!logo || typeof logo !== 'string') {
      return '';
    }
    const trimmed = logo.trim();
    if (!trimmed) {
      return '';
    }
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('data:') || lower.startsWith('http') || lower.startsWith('/')) {
      return trimmed;
    }
    return `data:image/png;base64,${trimmed}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already set to default
    if (img.src && !img.src.includes('fovesta1.png')) {
      img.src = 'assets/img/fovesta1.png';
    } else {
      // If default also fails, hide the image
      img.style.display = 'none';
    }
  }
}
