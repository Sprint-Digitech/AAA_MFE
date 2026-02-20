import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule, ReactiveFormsModule, FormsModule, MatInputModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'login';
  isLoginPage = true;
  isExpanded = true;
  isSidebarCollapsed = false; // Add compatibility for my existing toggle if needed
  openSubmenus: Set<string> = new Set();
  menus: any[] = [];
  user: any = null;
  currentSubmenuTop = 0;

  // Search functionality
  globalSearchTerm = '';
  isGlobalSearchOpen = false;
  globalEmployeeResults: any[] = [];
  isSearchingEmployees = false;

  // User dropdown
  showUserDropdown = false;
  signoutHover = false;

  // User details
  private readonly emptyUserDetails = {
    name: '',
    email: '',
    role: '',
    department: '',
    designation: '',
  };
  userDetails = { ...this.emptyUserDetails };


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

  constructor(private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      console.log('AppComponent: URL Changed to', url);
      this.isLoginPage = url === '/login' || url === '/' || url === '' || url === '/register' || url.includes('forgot-password');
      console.log('AppComponent: isLoginPage =', this.isLoginPage);
      this.loadUserData();

      this.globalSearchTerm = '';
      this.isGlobalSearchOpen = false;
      this.globalEmployeeResults = [];
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.hydrateUserDetailsFromSession();
  }

  loadUserData() {
    const storedMenus = sessionStorage.getItem('menus');
    const storedUser = sessionStorage.getItem('user');
    if (storedMenus) {
      this.menus = JSON.parse(storedMenus);
    }
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.setUserDetails(this.user);
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
    const term = this.globalSearchTerm.trim();

    if (!term) {
      this.globalEmployeeResults = [];
      this.isGlobalSearchOpen = false;
      this.cdr.markForCheck();
      return;
    }

    this.isSearchingEmployees = true;
    this.globalEmployeeResults = [];
    this.isGlobalSearchOpen = true;
    this.cdr.markForCheck();

    // Replace with your actual employee service call
    try {
      // const result = await lastValueFrom(
      //   this.employeeService.getEmployee('api/Employee/EmployeeBasicDetailList', { SearchTerm: term })
      // );

      // Mock data for demonstration - replace with actual API call
      const result = [
        { employeeId: '1', employeeFirstName: 'John', employeeLastName: 'Doe', employeeCode: 'E001', departmentName: 'IT' },
        { employeeId: '2', employeeFirstName: 'Jane', employeeLastName: 'Smith', employeeCode: 'E002', departmentName: 'HR' }
      ].filter(emp =>
        emp.employeeFirstName.toLowerCase().includes(term.toLowerCase()) ||
        emp.employeeLastName.toLowerCase().includes(term.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(term.toLowerCase())
      );

      const employees = Array.isArray(result) ? result : [];
      this.globalEmployeeResults = employees.map((employee) => this.normalizeEmployee(employee));
      this.isGlobalSearchOpen = true;
    } catch (error) {
      console.error('Search error:', error);
      this.globalEmployeeResults = [];
      this.isGlobalSearchOpen = false;
    } finally {
      this.isSearchingEmployees = false;
      this.cdr.markForCheck();
    }
  }

  onHeaderInput(value: string): void {
    this.globalSearchTerm = value;
    const term = value.trim();

    if (!term) {
      this.globalEmployeeResults = [];
      this.isGlobalSearchOpen = false;
      this.isSearchingEmployees = false;
      this.cdr.markForCheck();
    } else {
      this.onGlobalSearch();
    }
  }

  openGlobalSearchResults(): void {
    if (this.globalEmployeeResults.length) {
      this.isGlobalSearchOpen = true;
      this.cdr.markForCheck();
    }
  }

  closeGlobalSearch(): void {
    this.isGlobalSearchOpen = false;
  }

  clearGlobalSearch(): void {
    this.globalSearchTerm = '';
    this.globalEmployeeResults = [];
    this.isGlobalSearchOpen = false;
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
    this.cdr.markForCheck();
  }

  private normalizeEmployee(employee: any) {
    if (!employee || typeof employee !== 'object') {
      return {};
    }

    return {
      ...employee,
      employeeId: employee.employeeId || employee.EmployeeId || employee.id || '',
      employeeCode: employee.employeeCode || employee.EmployeeCode || employee.code || '',
      employeeFirstName: employee.employeeFirstName || employee.firstName || employee.name || '',
      employeeMiddleName: employee.employeeMiddleName || employee.middleName || '',
      employeeLastName: employee.employeeLastName || employee.lastName || '',
      departmentName: employee.departmentName || employee.department || '',
      designationName: employee.designationName || employee.designation || '',
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

  logout(): void {
    console.log('Logout requested');

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
    this.isLoginPage = true; // Important: Set this to true

    // Force immediate UI update
    this.cdr.detectChanges();

    // Use Router for navigation to respect base-href and avoid full page reload issues on some environments
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

    this.cdr.markForCheck();
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
}
