import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AccountService } from '../../shared/services/account.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent implements OnInit, OnDestroy {
  user: any | null = null;
  menus: any[] = [];
  private subscription = new Subscription();

  constructor(
    private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const tenantSchema = this.route.snapshot.queryParamMap.get('tenant');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (tenantSchema && email) {
      // Set tenant schema for this tab
      sessionStorage.setItem('tenantSchema', tenantSchema);

      // Fetch user details for tenant & email
      this.accountService
        .getEmployeeLoginDetail(email, tenantSchema)
        .subscribe({
          next: (userDetail: any) => {
            this.user = userDetail;

            // Process menus from roles
            const processedMenus = this.processMenus(
              userDetail.employeeRoleLoginDtos ?? []
            );
            this.menus = processedMenus;

            // Set full user and menus in sessionStorage and observables
            sessionStorage.setItem('user', JSON.stringify(this.user));
            sessionStorage.setItem('menus', JSON.stringify(this.menus));
            this.accountService.setUser(this.user);
            this.accountService.setMenuData(this.menus);

            // Clear localStorage to avoid stale data contamination
            localStorage.clear();

            // Fetch tenant-specific branches and company info in parallel
            forkJoin({
              branches: this.accountService.getBranchesForTenant(tenantSchema),
              companyInfo:
                this.accountService.getCompanyInfoForTenant(tenantSchema),
            }).subscribe({
              next: ({ branches, companyInfo }) => {
                if (branches) {
                  sessionStorage.setItem('branches', JSON.stringify(branches));
                  if (this.accountService.setBranches)
                    this.accountService.setBranches(branches);
                }
                if (companyInfo) {
                  sessionStorage.setItem(
                    'company',
                    JSON.stringify(companyInfo)
                  );
                  if (this.accountService.setCompany)
                    this.accountService.setCompany(companyInfo);
                }
                // After all data, navigate to initial setup
                this.router.navigate(['/initial-setup']);
              },
              error: (error) => {
                console.error(
                  'Error fetching branches or company info:',
                  error
                );
                // Optional: route to error page or show message
              },
            });
          },
          error: (error) => {
            console.error('Error fetching employee login detail:', error);
            // Optional: Redirect to login or error page
          },
        });
    } else {
      console.error('Missing tenant or email query params');
      // Optional: Redirect to login or error page
    }

    // Subscribe to reactive state updates for user and menus
    this.subscription.add(
      this.accountService.user$.subscribe((user) => {
        this.user = user;
      })
    );
    this.subscription.add(
      this.accountService.menuData$.subscribe((menus) => {
        this.menus = menus || [];
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout(): void {
    sessionStorage.clear();
    localStorage.clear();
    this.accountService.logout();
  }

  private processMenus(menuData: any[]): any[] {
    const menuMap = new Map<string, any>();

    menuData.forEach((menu) => {
      if (!menu.menuParentId) {
        menuMap.set(menu.menuID, {
          ...menu,
          submenu: [],
        });
      }
    });

    menuData.forEach((menu) => {
      if (menu.menuParentId) {
        const parentMenu = menuMap.get(menu.menuParentId);
        if (parentMenu) {
          parentMenu.submenu.push(menu);
        }
      }
    });

    const resultMenus = Array.from(menuMap.values());
    resultMenus.sort((a, b) => (a.srNo ?? 0) - (b.srNo ?? 0));
    resultMenus.forEach((menu) => {
      if (menu.submenu && menu.submenu.length > 0) {
        menu.submenu.sort((a: any, b: any) => (a.srNo ?? 0) - (b.srNo ?? 0));
      }
    });
    return resultMenus;
  }
}
