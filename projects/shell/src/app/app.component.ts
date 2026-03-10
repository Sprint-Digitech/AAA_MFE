import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { GlobalSearchService } from './shared/services/global-search.service';
import { LoaderComponent } from './loader/loader/loader.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule, FormsModule, LoaderComponent, MatTooltipModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoginPage = true;
  isExpanded = true;
  isSidebarCollapsed = false;
  user: any = null;
  menus: any[] = [];
  currentUrl: string = '';
  globalSearchTerm: string = '';

  // User dropdown
  showUserDropdown = false;
  signoutHover = false;
  userDetails: any = {
    name: '',
    email: '',
    role: '',
    department: '',
    designation: '',
  };

  // Navigation State
  openSubmenus: Set<string> = new Set();
  currentSubmenuTop = 0;

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
    Dashboard: 'dashboard'
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private globalSearchService: GlobalSearchService
  ) {
    console.log('Shell: Restoring Original SD Nemo UI...');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateState((event.urlAfterRedirects || event.url));
      this.globalSearchTerm = '';
      this.globalSearchService.emit('');
    });
  }

  ngOnInit() {
    this.updateState(this.router.url);

    // Listen for messages from MFEs
    window.addEventListener('message', (event) => {
      if (!event.data) return;

      if (event.data.type === 'LOGOUT') {
        this.logout(false);
      }

      if (event.data.type === 'ROUTER_NAVIGATED') {
        let fullUrl = event.data.url;
        const isLocal = window.location.hostname === 'localhost';
        if (!isLocal && !fullUrl.startsWith('/Gateway/dist')) {
          fullUrl = '/Gateway/dist' + (fullUrl.startsWith('/') ? '' : '/') + fullUrl;
        }
        if (window.location.pathname !== fullUrl) {
          window.history.replaceState(null, '', fullUrl);
        }
      }

      if (event.data.type === 'REQUEST_TOKEN') {
        // Handle token requests from MFEs by sending what's in session
        this.sendSessionToIframes();
      }
    });

    this.loadUserData();
  }

  updateState(rawUrl: string) {
    this.currentUrl = rawUrl.split('?')[0];
    const url = this.currentUrl.toLowerCase();

    // Auth routes strictly for authentication (no shell)
    const authOnlyPaths = ['/login', '/register', '/forgot-password', '/reset', '/authentication/login', '/welcome'];

    // Check if we are on a functional page that SHOULD have a shell
    const isFunctionalAuthPath = url.includes('initial-setup') ||
      url.includes('menumaster') ||
      url.includes('userroles') ||
      url.includes('responsibility') ||
      url.includes('company');

    this.isLoginPage = (authOnlyPaths.some(p => url.includes(p)) || url === '/' || url === '' || url.endsWith('/dist') || url.endsWith('/dist/')) && !isFunctionalAuthPath;
    console.log('Shell: Current URL path:', url);

    // Improved detection: check for common login/register paths
    // A page is a login page (no shell) if it's explicitly /login, /register, or forgot/reset.
    // 'welcome' and others have been removed because they should show the shell.
    this.isLoginPage =
      url === '/login' ||
      url === '/' ||
      url === '' ||
      url === '/register' ||
      url === '/authentication/login' ||
      url.includes('forgot-password') ||
      url.includes('reset') ||
      url.includes('login-inventory');

    console.log(`[Shell] URL: ${url}, isLoginPage: ${this.isLoginPage}`);

    this.loadUserData();
    this.cdr.detectChanges();
  }

  get userInitials(): string {
    const source = (this.userDetails.name || '').trim();
    if (!source) return '?';
    const parts = source.split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const firstInitial = parts[0]?.charAt(0) ?? '';
    const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? '' : '';
    const initials = `${firstInitial}${lastInitial}`.trim() || firstInitial;
    return initials.toUpperCase() || '?';
  }

  loadUserData() {
    try {
      const storedUser = sessionStorage.getItem('user');
      const storedMenus = sessionStorage.getItem('menus');
      if (storedUser && storedUser !== 'undefined') {
        this.user = JSON.parse(storedUser);
        this.setUserDetails(this.user);
      }
      if (storedMenus && storedMenus !== 'undefined') {
        this.menus = JSON.parse(storedMenus);
      }
    } catch (e) {
      console.warn('Session data parse error', e);
    }
  }

  setUserDetails(userData: any | null | undefined) {
    if (!userData || typeof userData !== 'object') {
      this.userDetails = {
        name: '',
        email: '',
        role: '',
        department: '',
        designation: '',
      };
      return;
    }

    const displayName = this.getDisplayName(userData);
    const email = userData.email || userData.loginEmail || userData.employeeEmail || '';
    const roles = Array.isArray(userData?.employeeRoleLoginDtos) ? userData.employeeRoleLoginDtos : [];
    const primaryRole = roles.find((role: any) => role?.isPrimary) || roles[0] || null;
    const roleName = primaryRole?.roleName || primaryRole?.roleDescription || userData.role || '';

    this.userDetails = {
      name: displayName,
      email: typeof email === 'string' ? email.trim() : '',
      role: roleName,
      department: userData.departmentName || userData.department || '',
      designation: userData.designationName || userData.designation || ''
    };
  }

  private getDisplayName(userData: any): string {
    const nameParts = [
      userData.firstName || userData.employeeFirstName || userData.employeeName || '',
      userData.middleName || userData.employeeMiddleName || '',
      userData.lastName || userData.employeeLastName || '',
    ]
      .map((part: string) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);

    if (nameParts.length) return nameParts.join(' ');

    const fallback = userData.displayName || userData.userName || userData.email || userData.loginname || '';
    return typeof fallback === 'string' ? fallback.trim() : '';
  }

  onUserClick(event: Event) {
    event.stopPropagation();
    this.showUserDropdown = !this.showUserDropdown;
  }

  onSignoutHover(hover: boolean) {
    this.signoutHover = hover;
  }

  // Sidebar Methods
  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    this.isSidebarCollapsed = !this.isExpanded;
    if (!this.isExpanded) {
      this.openSubmenus.clear();
    }
    this.cdr.detectChanges();
  }

  onMenuClick(event: Event, menu: any) {
    event.stopPropagation();
    if (!this.isExpanded) {
      this.isExpanded = true;
      this.isSidebarCollapsed = false;
    }

    if (this.hasSubmenu(menu)) {
      event.preventDefault();
      const menuId = menu.menuDisplayName;
      const wasOpen = this.isSubmenuOpen(menuId);

      this.openSubmenus.clear();
      if (!wasOpen) {
        this.openSubmenus.add(menuId);
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        this.currentSubmenuTop = rect.top - 12;
      }
    } else {
      this.openSubmenus.clear();
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

  closeSubmenus() {
    this.openSubmenus.clear();
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-item') && !target.closest('.submenu')) {
      this.closeSubmenus();
    }
    if (!target.closest('.user-profile') && !target.closest('.user-profile-dropdown')) {
      this.showUserDropdown = false;
    }
  }

  onSearchInput(value: string) {
    const term = value.trim();
    this.globalSearchTerm = value;
    this.globalSearchService.emit(term);
    this.sendSearchToIframes(term);
  }

  private sendSearchToIframes(term: string) {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({
        type: 'GLOBAL_SEARCH',
        term: term
      }, '*');
    });
  }

  logout(propagate: boolean = true) {
    console.log('Shell: Logging out...');
    if (propagate) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.contentWindow?.postMessage({ type: 'LOGOUT' }, '*');
      });
    }

    sessionStorage.clear();
    localStorage.clear();
    this.user = null;
    this.menus = [];

    const isLocal = window.location.hostname === 'localhost';
    const loginPath = isLocal ? '/#/login' : '/Gateway/dist/#/login';
    window.location.href = window.location.origin + loginPath;
  }

  private sendSessionToIframes() {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    const tenantSchema = sessionStorage.getItem('tenantSchema');

    if (token) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.contentWindow?.postMessage({
          type: 'SET_TOKEN',
          token: token.startsWith('{') ? JSON.parse(token) : token,
          user: user ? JSON.parse(user) : null,
          tenantSchema: tenantSchema
        }, '*');
      });
    }
  }
}
