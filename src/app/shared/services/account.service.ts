import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { AuditLoggingService } from './audit-logging.service';
import { SecureTokenStorageService } from './secure-token-storage.service';

export interface Login {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class Employee {
  email!: string;
  firstName!: string;
  lastName!: string;
}

export interface LoginResponse {
  employee: Employee;
  token: string;
  errors: string;
}

export interface UserForRegistrationDto {
  firstName: string;
  lastName: string;
  tenantSchema?: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export interface RegistrationResponseDto {
  isSuccessfulRegistration: boolean;
  errros: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private userSubject$ = new BehaviorSubject<any | null>(
    JSON.parse(sessionStorage.getItem('user') || 'null'),
  );
  public user$ = this.userSubject$.asObservable();
  private menuDataSubject = new BehaviorSubject<any[]>(
    JSON.parse(sessionStorage.getItem('menus') || '[]'),
  );
  public menuData$ = this.menuDataSubject.asObservable();
  private loginSubject$: BehaviorSubject<any | null>;
  public user: Observable<any | null>;
  private onboardingModeSubject = new BehaviorSubject<boolean>(false);
  public onboardingMode$ = this.onboardingModeSubject.asObservable();

  private activeOnboardingStepSubject = new BehaviorSubject<number>(0);
  public activeOnboardingStep$ =
    this.activeOnboardingStepSubject.asObservable();

  private onboardingHeaderModeSubject = new BehaviorSubject<boolean>(false);
  public onboardingHeaderMode$ =
    this.onboardingHeaderModeSubject.asObservable();
  constructor(
    private router: Router,
    private http: HttpClient,
    private auditLogger: AuditLoggingService,
    private secureTokenStorage: SecureTokenStorageService,
  ) {
    this.loginSubject$ = new BehaviorSubject(
      JSON.parse(sessionStorage.getItem('user')!),
    );
    this.user = this.loginSubject$.asObservable();
  }

  environment = {
    production: false,
    urlAddress: 'https://dev.fovestta.com/Auth/sdapi',
  };

  public get userValue() {
    return this.loginSubject$.value;
  }

  login(route: string, body: Login) {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.post<LoginResponse>(url, body).pipe(
      map((loginUser: any) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (loginUser != null && loginUser.employee != null) {
          sessionStorage.setItem('token', JSON.stringify(loginUser.token));
          sessionStorage.setItem(
            'tenantSchema',
            loginUser.employee.tenantSchema,
          );
          this.loginSubject$.next(loginUser);
          return loginUser;
        } else {
        }
      }),
    );
  }

  public getEmployeesForAnnualComponent(payHeadIds: string[]): Observable<any> {
    const route = 'api/bankMaster/GetEmployeesForAnnualComponent';
    return this.http.post<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      payHeadIds
    );
  }

  public getEmployeesAnnualComponentList(): Observable<any> {
    const route = 'api/AnnualComponent/GetAnnualComponents';
    return this.http.get<any>(
      this.createCompleteRoute(route, this.environment.urlAddress)
    );
  }

  public createAnnualComponent(payload: any): Observable<any> {
    const route = `${this.environment.urlAddress}/api/AnnualComponent/CreateAnnualComponent`;
    return this.http.post<any>(route, payload);
  }

  step(endpoint: string, params: any): Observable<any> {
    const url = `${this.environment.urlAddress}/api/${endpoint}`;
    return this.http.get(url, { params });
  }

  logindetail(route: string) {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.get<any>(url).pipe(
      map((loginUser: any) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (loginUser != null) {
          sessionStorage.setItem('user', JSON.stringify(loginUser));
          // this.loginSubject$.next(loginUser);
          return loginUser;
        } else {
        }
      }),
    );
  }

  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  };

  public getEmployee = (route: any, params?: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      { params },
    );
  };

  public getDataWithBranchId<T>(
    route: string,
    options?: { headers?: HttpHeaders },
  ): Observable<T> {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.get<T>(url, options);
  }

  loginGroupTenant(payload: any) {
    const url = this.environment.urlAddress;
    return this.http.post(`${url}/api/Account/LoginGroupTenant`, payload);
  }

  public getCompany = (route: string, headers?: HttpHeaders) => {
    const options = headers ? { headers } : {};
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      options,
    );
  };

  public update = (route: string, body: any) => {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.put(url, body);
  };
  public post = (route: string, body: any, headers?: HttpHeaders) => {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.post(url, body, { headers });
  };

  public get = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };

  public delete = (route: string) => {
    return this.http.delete(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };

  public put(email: string, tenantSchema: string, companyName: string) {
    const url = this.environment.urlAddress;
    return this.http.put(
      `${url}/api/Account/UpdateTenantControl?EmailID=${email}&tenantSchema=${encodeURIComponent(tenantSchema)}&companyName=${encodeURIComponent(companyName)}`,
      {},
      { responseType: 'text' as 'json' }, // Handle string response
    );
  }

  public registerUser = (
    route: string,
    body: UserForRegistrationDto,
    customHeaders?: { [key: string]: string },
  ) => {
    const url = this.createCompleteRoute(route, this.environment.urlAddress);

    // Add custom headers if provided
    // Registration requests skip timeout entirely - they can take as long as needed
    let headersMap: { [key: string]: string } = {
      'X-Skip-Timeout': 'true', // Skip timeout interceptor for registration (can take very long)
      'X-Skip-Deduplication': 'true', // Skip request deduplication for registration
      'X-Skip-Retry': 'true', // Skip retry logic for registration (idempotency)
      'x-tenant-schema': 'dbo', // Use dbo as the default schema for registration
      ...customHeaders,
    };

    // Convert headers object to HttpHeaders
    let httpHeaders = new HttpHeaders();
    Object.keys(headersMap).forEach((key) => {
      httpHeaders = httpHeaders.set(key, headersMap[key]);
    });

    return this.http.post<RegistrationResponseDto>(url, body, {
      headers: httpHeaders,
    });
  };

  GoogleLogin(idToken: string) {
    const url = this.environment.urlAddress;
    return this.http.post(`${url}/api/Account/google-login`, { idToken });
  }

  setUser(user: any) {
    sessionStorage.setItem('user', JSON.stringify(user));
    this.userSubject$.next(user);
  }

  setMenuData(data: any[]) {
    // Create a new array reference to ensure change detection triggers
    const newMenuData = Array.isArray(data) ? [...data] : [];
    sessionStorage.setItem('menus', JSON.stringify(newMenuData));
    console.log(
      'setMenuData: Updating menu observable with',
      newMenuData.length,
      'menus',
    );
    this.menuDataSubject.next(newMenuData);
  }

  getEmployeeLoginDetail(email: string, tenantSchema: string): Observable<any> {
    const url = `${this.environment.urlAddress
      }/api/Account/GetEmployeeRoleDetail?email=${encodeURIComponent(email)}`;
    const headers = { 'x-tenant-schema': tenantSchema };

    return this.http.get(url, { headers });
  }

  // Get branches of the company for given tenant
  getBranchesForTenant(tenantSchema: string): Observable<any[]> {
    const url = `${this.environment.urlAddress}/api/company-branch/GetCompanyBranch`;
    const headers = { 'x-tenant-schema': tenantSchema };
    return this.http.get<any[]>(url, { headers });
  }
  // Get company info for given tenant
  getCompanyInfoForTenant(tenantSchema: string): Observable<any> {
    const url = `${this.environment.urlAddress}/api/company-branch/GetCompany`; // Adjust endpoint accordingly
    const headers = { 'x-tenant-schema': tenantSchema };
    return this.http.get<any>(url, { headers });
  }

  private branchesSubject = new BehaviorSubject<any[]>([]);
  public branches$ = this.branchesSubject.asObservable();

  setBranches(branches: any[]) {
    sessionStorage.setItem('branches', JSON.stringify(branches));
    this.branchesSubject.next(branches);
  }

  private companySubject = new BehaviorSubject<any>(null);
  public company$ = this.companySubject.asObservable();

  setCompany(company: any) {
    sessionStorage.setItem('company', JSON.stringify(company));
    this.companySubject.next(company);
  }

  clearUser() {
    sessionStorage.removeItem('user');
    this.userSubject$.next(null);
  }

  clearMenus() {
    sessionStorage.removeItem('menus');
    this.menuDataSubject.next([]);
  }

  public forgotPassword = (route: any, body: any) => {
    return this.http.post<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      body,
      { responseType: 'text' as 'json' },
    );
  };

  public resetPassword = (route: any, body: any) => {
    return this.http.post<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      body,
      { responseType: 'text' as 'json' },
    );
  };

  // Get current menus sync (optional)
  getMenuData(): any[] {
    return this.menuDataSubject.getValue();
  }

  // Reload menu data from API and update observable
  reloadMenuData(): Observable<any[]> {
    const user = this.userValue;
    if (!user) {
      console.warn('Cannot reload menu data: user not found');
      return of([]);
    }

    // Try multiple email fields (same logic as app.component.ts)
    const email =
      user.email ||
      user.employeeEmail ||
      user.loginEmail ||
      user.userEmail ||
      (user.employee && user.employee.email);

    if (!email) {
      console.warn(
        'Cannot reload menu data: user email not found in user object',
        user,
      );
      return of([]);
    }

    const tenantSchema = sessionStorage.getItem('tenantSchema');

    let request: Observable<any>;
    if (tenantSchema) {
      request = this.getEmployeeLoginDetail(email, tenantSchema);
    } else {
      request = this.logindetail(
        `api/Account/GetEmployeeRoleDetail?email=${encodeURIComponent(email)}`,
      );
    }

    return request.pipe(
      map((userDetail: any) => {
        console.log('reloadMenuData: API response received', userDetail);
        if (userDetail && userDetail.employeeRoleLoginDtos) {
          console.log(
            'reloadMenuData: Processing menus from employeeRoleLoginDtos',
            userDetail.employeeRoleLoginDtos.length,
          );

          // Log all menu statuses before filtering
          console.log(
            'reloadMenuData: Menu statuses before filtering:',
            userDetail.employeeRoleLoginDtos.map((m: any) => ({
              name: m.menuName,
              status: m.status ?? m.menuMaster?.status ?? m.menu?.status,
              menuParentId: m.menuParentId,
            })),
          );

          const processedMenus = this.processMenus(
            userDetail.employeeRoleLoginDtos,
          );
          console.log(
            'reloadMenuData: Processed menus after filtering',
            processedMenus,
          );
          console.log(
            'reloadMenuData: Active menu names:',
            processedMenus.map((m: any) => m.menuName),
          );

          // Force update the observable
          this.setMenuData(processedMenus);
          console.log(
            'Menu data reloaded successfully. Active menus:',
            processedMenus.length,
          );
          return processedMenus;
        } else {
          console.warn(
            'Menu data reload failed: employeeRoleLoginDtos not found in response',
            userDetail,
          );
          // Keep existing menus if reload fails
          const currentMenus = this.getMenuData();
          return currentMenus || [];
        }
      }),
      catchError((error) => {
        console.error('Error reloading menu data:', error);
        // Keep existing menus if API call fails
        const currentMenus = this.getMenuData();
        return of(currentMenus || []);
      }),
    );
  }

  // Process menus sorting root and submenus by srNo ascending (using DB srNo)
  private processMenus(menuData: any[]): any[] {
    if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
      console.warn('processMenus: Invalid or empty menu data', menuData);
      return [];
    }

    const menuMap = new Map<number, any>();

    // Filter only active menus (status === 1)
    // Handle both direct status and nested status (menuMaster.status)
    // Explicitly exclude status === 0 (inactive) or false
    const activeMenus = menuData.filter((menu: any) => {
      const status =
        menu.status ?? menu.menuMaster?.status ?? menu.menu?.status;

      // Convert status to number for consistent comparison
      let statusNum: number | null = null;
      if (typeof status === 'number') {
        statusNum = status;
      } else if (typeof status === 'boolean') {
        statusNum = status ? 1 : 0;
      } else if (typeof status === 'string') {
        statusNum =
          status === '1' || status.toLowerCase() === 'true'
            ? 1
            : status === '0' || status.toLowerCase() === 'false'
              ? 0
              : null;
      }

      // Explicitly exclude inactive menus (status === 0)
      if (statusNum === 0) {
        console.log(
          `❌ Filtering out INACTIVE menu: ${menu.menuName} (status: ${status}, converted: ${statusNum})`,
        );
        return false; // Explicitly inactive - exclude
      }

      // Only include if status is explicitly 1 or undefined (backend may have filtered)
      const isActive = statusNum === 1 || statusNum === null;

      if (!isActive && statusNum !== null) {
        console.log(
          `⚠️ Filtering out menu with unclear status: ${menu.menuName} (status: ${status}, converted: ${statusNum})`,
        );
      }

      return isActive;
    });

    console.log(
      `processMenus: Total menus: ${menuData.length}, Active menus: ${activeMenus.length}`,
    );

    if (activeMenus.length === 0 && menuData.length > 0) {
      console.warn(
        'processMenus: All menus filtered out. Sample menu structure:',
        menuData[0],
      );
    }

    // Log any menus that were filtered out for debugging
    const filteredOut = menuData.filter((menu: any) => {
      const status =
        menu.status ?? menu.menuMaster?.status ?? menu.menu?.status;
      return status === 0 || status === false || status === '0';
    });
    if (filteredOut.length > 0) {
      console.log(
        'processMenus: Filtered out inactive menus:',
        filteredOut.map((m: any) => m.menuName),
      );
    }

    // Collect root menus (menuParentId === null)
    // activeMenus already contains only active menus, so we can add them directly
    activeMenus.forEach((menu) => {
      if (!menu.menuParentId) {
        // Double-check status using same logic as filter
        const status =
          menu.status ?? menu.menuMaster?.status ?? menu.menu?.status;
        let statusNum: number | null = null;
        if (typeof status === 'number') {
          statusNum = status;
        } else if (typeof status === 'boolean') {
          statusNum = status ? 1 : 0;
        } else if (typeof status === 'string') {
          statusNum =
            status === '1' || status.toLowerCase() === 'true'
              ? 1
              : status === '0' || status.toLowerCase() === 'false'
                ? 0
                : null;
        }

        // Only add if status is 1 or null (activeMenus should already be filtered, but double-check)
        if (statusNum !== 0) {
          menuMap.set(menu.menuID, {
            menuID: menu.menuID,
            menuName: menu.menuName,
            menuDisplayName: menu.menuDisplayName,
            menuPath: menu.menuPath,
            menuParentId: menu.menuParentId,
            srNo: menu.srNo, // FROM DATABASE, not remapped
            submenu: [],
          });
        } else {
          console.log(
            `🚫 BLOCKED inactive root menu from being added: ${menu.menuName} (status: ${status})`,
          );
        }
      }
    });

    // Add submenus under their parent
    activeMenus.forEach((menu) => {
      if (menu.menuParentId) {
        // Double-check status using same logic as filter
        const status =
          menu.status ?? menu.menuMaster?.status ?? menu.menu?.status;
        let statusNum: number | null = null;
        if (typeof status === 'number') {
          statusNum = status;
        } else if (typeof status === 'boolean') {
          statusNum = status ? 1 : 0;
        } else if (typeof status === 'string') {
          statusNum =
            status === '1' || status.toLowerCase() === 'true'
              ? 1
              : status === '0' || status.toLowerCase() === 'false'
                ? 0
                : null;
        }

        // Only add if status is 1 or null
        if (statusNum !== 0) {
          const parentMenu = menuMap.get(menu.menuParentId);
          if (parentMenu) {
            parentMenu.submenu.push({
              menuID: menu.menuID,
              menuName: menu.menuName,
              menuDisplayName: menu.menuDisplayName,
              menuPath: menu.menuPath,
              menuParentId: menu.menuParentId,
              srNo: menu.srNo, // FROM DATABASE, not remapped
            });
          }
        } else {
          console.log(
            `🚫 BLOCKED inactive submenu from being added: ${menu.menuName} (status: ${status})`,
          );
        }
      }
    });

    // Final cleanup: Remove any parent menus that have no active children (orphaned parents)
    const menusToRemove: number[] = [];
    menuMap.forEach((menu, menuID) => {
      // If it's a parent with no children and no direct path, consider removing it
      // But keep it if it has a menuPath (it might be a standalone menu)
      if (menu.submenu.length === 0 && !menu.menuPath) {
        // This is an orphaned parent - remove it
        menusToRemove.push(menuID);
      }
    });
    menusToRemove.forEach((menuID) => {
      menuMap.delete(menuID);
      console.log(`Removed orphaned parent menu: ${menuID}`);
    });

    // Sort root menus by srNo ascending
    // Use a high number for null/undefined srNo to push them to the end, not the top
    const resultMenus = Array.from(menuMap.values());

    // First, separate menus with and without srNo
    const menusWithSrNo = resultMenus.filter(
      (m) => m.srNo != null && m.srNo !== undefined,
    );
    const menusWithoutSrNo = resultMenus.filter(
      (m) => m.srNo == null || m.srNo === undefined,
    );

    // Sort menus with srNo
    menusWithSrNo.sort((a, b) => {
      const srNoA = a.srNo ?? 999999;
      const srNoB = b.srNo ?? 999999;
      return srNoA - srNoB;
    });

    // Combine: menus with srNo first, then menus without srNo
    const sortedMenus = [...menusWithSrNo, ...menusWithoutSrNo];

    // Sort submenus by srNo ascending
    sortedMenus.forEach((menu) => {
      if (menu.submenu && menu.submenu.length > 0) {
        const submenusWithSrNo = menu.submenu.filter(
          (s: any) => s.srNo != null && s.srNo !== undefined,
        );
        const submenusWithoutSrNo = menu.submenu.filter(
          (s: any) => s.srNo == null || s.srNo === undefined,
        );

        submenusWithSrNo.sort((a: any, b: any) => {
          const srNoA = a.srNo ?? 999999;
          const srNoB = b.srNo ?? 999999;
          return srNoA - srNoB;
        });

        menu.submenu = [...submenusWithSrNo, ...submenusWithoutSrNo];
      }
    });

    console.log(
      'processMenus: Final menu order:',
      sortedMenus.map((m) => ({ name: m.menuName, srNo: m.srNo })),
    );
    console.log('processMenus: Total final menus:', sortedMenus.length);

    // Verify no inactive menus made it through - log for debugging
    const inactiveInSource = menuData.filter((m: any) => {
      const status = m.status ?? m.menuMaster?.status ?? m.menu?.status;
      let statusNum: number | null = null;
      if (typeof status === 'number') {
        statusNum = status;
      } else if (typeof status === 'boolean') {
        statusNum = status ? 1 : 0;
      } else if (typeof status === 'string') {
        statusNum =
          status === '1' || status.toLowerCase() === 'true'
            ? 1
            : status === '0' || status.toLowerCase() === 'false'
              ? 0
              : null;
      }
      return statusNum === 0;
    });

    if (inactiveInSource.length > 0) {
      console.log(
        `⚠️ processMenus: Found ${inactiveInSource.length} inactive menus in source:`,
        inactiveInSource.map((m: any) => ({
          name: m.menuName,
          status: m.status ?? m.menuMaster?.status ?? m.menu?.status,
        })),
      );
      console.log('✅ These should NOT appear in final result');
    }

    return sortedMenus;
  }

  logout() {
    // Log logout event
    this.auditLogger.logLogout();

    // Clear secure token storage
    this.secureTokenStorage.clearAll();

    sessionStorage.clear();
    // localStorage.clear();
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tenantSchema');
    localStorage.removeItem('token');
    this.clearMenus();
    this.clearUser();
    this.loginSubject$.next(null);
    this.router.navigate(['/login']);
  }
}
