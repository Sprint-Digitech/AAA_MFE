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
  ) { }

  ngOnInit(): void {
    let tenantSchema = this.route.snapshot.queryParamMap.get('tenant');
    let email = this.route.snapshot.queryParamMap.get('email');

    // Fallback to session storage if query params are missing
    if (!tenantSchema || !email) {
      tenantSchema = sessionStorage.getItem('tenantSchema');
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          email = user.email || user.employeeEmail;
        } catch (e) {
          console.error('Error parsing user from session', e);
        }
      }
    }

    if (tenantSchema && email) {
      // Ensure it is set in session if it came from query params
      sessionStorage.setItem('tenantSchema', tenantSchema);

      // Fetch user details for tenant & email
      this.accountService
        .getEmployeeLoginDetail(email, tenantSchema)
        .subscribe({
          next: (userDetail: any) => {
            this.user = userDetail;

            // Set full user in sessionStorage and observables
            sessionStorage.setItem('user', JSON.stringify(this.user));
            this.accountService.setUser(this.user);

            // Fetch the real menu tree from HRMSAuthZ (GetUserMenus) via the
            // same pipeline the normal password-login flow uses.
            // userDetail.employeeRoleLoginDtos are bare role assignments
            // (roleID/roleName/roleDisplayName only, no menuID/menuPath/
            // children) - running those through processMenus() as if they
            // were menus produced a single degenerate root entry with no
            // path and no submenu, so the sidebar rendered nothing.
            // menuData$ (subscribed below) picks up the result once loaded.
            // Pass email/tenantSchema explicitly - reloadMenuData()'s default
            // derivation (userValue) is backed by a session subject that
            // setUser() above does not update, so it'd still resolve to
            // whatever was inherited into this tab at window.open() time.
            this.accountService.reloadMenuData(email, tenantSchema).subscribe();

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
}
