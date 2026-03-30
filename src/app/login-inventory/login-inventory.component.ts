import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AccountService } from '../shared/services/account.service';
import { NotificationService } from '../shared/services/notification.service';
import { BehaviorSubject, first, Observable } from 'rxjs';
import { Login } from '../shared/services/account.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
    SocialAuthService,
    GoogleLoginProvider,
    SocialUser,
    GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'app-login-inventory',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatRadioModule,
        MatIconModule,
        MatSlideToggleModule,
        MatSelectModule,
        MatListModule,
        MatDividerModule,
        GoogleSigninButtonModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        RouterModule,
    ],
    templateUrl: './login-inventory.component.html',
    styleUrl: './login-inventory.component.scss'
})
export class LoginInventoryComponent {
    loginForm: FormGroup;
    user: SocialUser | null = null;
    hidePassword = true;
    loading = false;
    backgroundImage: string =
        "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),url('assets/img/background-inventory.avif')";
    submitted = false;
    returnUrl: string = '';
    error = '';
    emailFocused = false;
    pwFocused = false;
    login$ = new BehaviorSubject<boolean>(false);

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private authService: SocialAuthService,
        private notificationService: NotificationService,
        private http: HttpClient,
        private _snackBar: MatSnackBar
    ) {
        // Mark this browser as WMS product type so the guard redirects here on next visit
        localStorage.setItem('productType', 'wms');

        // ✅ Logout ke baad sessionStorage clear hoti hai (Next.js se)
        // Agar session mein user nahi hai toh accountService ka cached BehaviorSubject bhi clear karo
        // Warna constructor mein userValue truthy milta hai aur turant dashboard redirect ho jaata hai
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            this.accountService.setUser(null as any);
        }

        if (this.accountService.userValue) {
            const user = this.accountService.userValue;
            const branchId = user.companyBranchId || user.branchID || '';
            if (branchId) {
                this.accountService.step('InitialSetup/GetStatus', { companyBranchId: branchId }).subscribe({
                    next: (res: any) => {
                        if (res && res.isSetupComplete === false) {
                            this.router.navigate(['/initial-setup'], { replaceUrl: true });
                        } else {
                            if (window !== window.parent) {
                                window.parent.location.href = window.location.origin + '/dashboard';
                            } else {
                                this.router.navigate(['/dashboard'], { replaceUrl: true });
                            }
                            this.navigateToDashboard();
                        }
                    },
                    error: () => {
                        // ✅ Welcome ki jagah localhost:3000 open hoga
                        (window.top || window).location.href = (window.location.hostname === 'localhost' ? 'http://localhost:3000' : `${window.location.origin}/WMS/app`) + '/';
                    }
                });
            } else {
                // ✅ Welcome ki jagah localhost:3000 open hoga
                (window.top || window).location.href = (window.location.hostname === 'localhost' ? 'http://localhost:3000' : `${window.location.origin}/WMS/app`) + '/';
            }
        }
        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            rememberMe: [false],
        });
    }

    private navigateToDashboard(): void {
        sessionStorage.setItem('productType', 'inventory');

        const wmsBase = window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : `${window.location.origin}/WMS/app`;

        // Navigate top-level window so WMS app opens full screen, not inside iframe
        (window.top || window).location.href = wmsBase + '/';
    }

    get f() {
        return this.loginForm.controls;
    }

    ngOnInit(): void {
        this.authService.authState.subscribe((user) => {
            if (user && user.idToken) {
                this.accountService.GoogleLogin(user.idToken).subscribe(
                    (response) => {
                        if (response) {
                            const email = user.email;
                            this.accountService
                                .logindetail(`api/Account/GetEmployeeRoleDetail?email=${email}`)
                                .pipe(first())
                                .subscribe((userDetail) => {
                                    if (userDetail) {
                                        const processedRoles =
                                            userDetail.employeeRoleLoginDtos ?? [];
                                        const processedMenus = this.processMenus(processedRoles);

                                        const finalUser = {
                                            ...userDetail,
                                            employeeRoleLoginDtos: processedRoles,
                                        };

                                        sessionStorage.setItem(
                                            'menus',
                                            JSON.stringify(processedMenus)
                                        );
                                        sessionStorage.setItem('user', JSON.stringify(finalUser));
                                        this.accountService.setUser(finalUser);
                                        this.accountService.setMenuData(processedMenus);

                                        const branchId = finalUser.companyBranchId || finalUser.branchID || '';
                                        if (branchId) {
                                            this.callInitialSetupStatus(branchId).subscribe({
                                                next: (res: any) => {
                                                    if (res && res.isSetupComplete === false) {
                                                        this.router.navigate(['/initial-setup'], { replaceUrl: true });
                                                    } else {
                                                        if (window !== window.parent) {
                                                            window.parent.location.href = window.location.origin + '/dashboard';
                                                        } else {
                                                            this.router.navigate(['/dashboard'], { replaceUrl: true });
                                                        }
                                                        this.navigateToDashboard();
                                                    }
                                                },
                                                error: () => {
                                                    // ✅ Welcome ki jagah localhost:3000 open hoga
                                                    (window.top || window).location.href = (window.location.hostname === 'localhost' ? 'http://localhost:3000' : `${window.location.origin}/WMS/app`) + '/';
                                                }
                                            });
                                        } else {
                                            // ✅ Welcome ki jagah localhost:3000 open hoga
                                            (window.top || window).location.href = (window.location.hostname === 'localhost' ? 'http://localhost:3000' : `${window.location.origin}/WMS/app`) + '/';
                                        }
                                    }
                                });
                        } else {
                            this.router.navigate(['/login']);
                        }
                    },
                    (error) => {
                        console.error('Login failed:', error);
                    }
                );
            }
        });
    }

    signInWithGoogle(): void {
        this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
    }

    submit(): void {
        this.submitted = true;
        this.error = '';
        if (this.loginForm.invalid) {
            this.notificationService.showError('Please fill all required fields.');
            return;
        }
        const user: Login = {
            email: this.loginForm.value.email,
            password: this.loginForm.value.password,
            rememberMe: this.loginForm.value.rememberMe,
            serviceType: 'WMS',
        };
        this.loading = true;

        this.accountService
            .login('api/Account/Login', user)
            .pipe(first())
            .subscribe({
                next: (loginResponse) => {
                    const emp = loginResponse?.employee;
                    const finalUser = {
                        email: emp?.email,
                        firstName: emp?.firstName || emp?.FirstName || '',
                        lastName: emp?.lastName || emp?.LastName || '',
                        tenantSchema: emp?.tenantSchema,
                        serviceType: emp?.serviceType || 'WMS',
                        id: emp?.id,
                    };

                    sessionStorage.setItem('user', JSON.stringify(finalUser));
                    if (emp?.tenantSchema) {
                        sessionStorage.setItem('tenantSchema', emp.tenantSchema);
                    }
                    this.accountService.setUser(finalUser);

                    // Fetch WMS permissions from WMSAuthZ (same as HRMS fetches menus from HRMSAuthZ)
                    const email = emp?.email ?? '';
                    const tenantSchema = emp?.tenantSchema ?? 'dbo';
                    this.accountService.getWmsPermissions(email, tenantSchema).subscribe({
                        next: (permissions) => {
                            if (permissions) {
                                sessionStorage.setItem('wmsPermissions', JSON.stringify(permissions));
                            }
                            this.navigateToDashboard();
                            this.loading = false;
                        },
                        error: () => {
                            // Navigate even if permissions call fails
                            this.navigateToDashboard();
                            this.loading = false;
                        }
                    });
                },
                error: (loginError) => {
                    const msg = this.handleError(
                        loginError,
                        'Login failed. Please try again.'
                    );
                    this.error = msg;
                    this.notificationService.showError(msg);
                    this.loading = false;
                },
            });
    }

    private handleError(
        err: any,
        fallback: string = 'An error occurred'
    ): string {
        try {
            if (err?.status === 401) {
                return 'Invalid User ID or Password';
            }

            if (err instanceof HttpErrorResponse) {
                if (err.status === 0 || !err.status) {
                    return 'Server is down. Please contact support.';
                }
            } else if (
                err?.status === 0 ||
                (!err?.status && err?.error === undefined)
            ) {
                return 'Server is down. Please contact support.';
            }

            if (err?.error?.errors) {
                return typeof err.error.errors === 'string'
                    ? err.error.errors
                    : fallback;
            }
            if (typeof err?.error === 'string') {
                return err.error;
            }
            if (err?.error?.Error?.Message) {
                return err.error.Error.Message;
            }
            if (err?.error?.message) {
                return err.error.message;
            }
            if (err?.message) {
                return err.message;
            }
        } catch { }
        return fallback;
    }

    private callInitialSetupStatus(branchId: string): Observable<any> {
        const params = { companyBranchId: branchId };
        return this.accountService.step('InitialSetup/GetStatus', params);
    }

    processMenus(menuData: any[]): any[] {
        const menuMap = new Map<number, any>();
        menuData.forEach((menu) => {
            if (!menu.menuParentId) {
                menuMap.set(menu.menuID, {
                    menuID: menu.menuID,
                    menuName: menu.menuName,
                    menuDisplayName: menu.menuDisplayName,
                    menuPath: menu.menuPath,
                    menuParentId: menu.menuParentId,
                    srNo: menu.srNo,
                    submenu: [],
                });
            }
        });

        menuData.forEach((menu) => {
            if (menu.menuParentId) {
                const parentMenu = menuMap.get(menu.menuParentId);
                if (parentMenu) {
                    parentMenu.submenu.push({
                        menuID: menu.menuID,
                        menuName: menu.menuName,
                        menuDisplayName: menu.menuDisplayName,
                        menuPath: menu.menuPath,
                        menuParentId: menu.menuParentId,
                        srNo: menu.srNo,
                    });
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