import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AccountService } from '../shared/services/account.service';
import { NotificationService } from '../shared/services/notification.service';
import { BehaviorSubject, first, forkJoin, Observable } from 'rxjs';
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
import { RequiredNemoComponent } from 'required-nemo-fovestta';
import { PasswordNemoComponent } from 'password-nemo';

@Component({
    selector: 'app-login',
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
        RequiredNemoComponent,
        PasswordNemoComponent,
        RouterModule,
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    user: SocialUser | null = null;
    hidePassword = true;
    loading = false;
    backgroundImage: string =
        "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),url('assets/img/teamless.jpg')";
    submitted = false;
    returnUrl: string = '';
    error = '';
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
        if (this.accountService.userValue) {
            this.router.navigate(['/welcome']);
        }
        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            rememberMe: [false],
        });
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
                                        if (!userDetail.companyId) {
                                            this.router.navigate(['employee/employeeOnboarding']);
                                            return;
                                        }

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

                                        this.router.navigate(['/welcome']);
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
        };
        this.loading = true;

        this.accountService
            .login('api/Account/Login', user)
            .pipe(first())
            .subscribe({
                next: (loginResponse) => {
                    const email = loginResponse?.employee?.email;

                    forkJoin({
                        employeeLoginDetail: this.accountService
                            .logindetail(`api/Account/GetEmployeeRoleDetail?email=${email}`)
                            .pipe(first()),
                    }).subscribe({
                        next: (results) => {
                            const userDetail = results.employeeLoginDetail;
                            if (userDetail !== undefined) {
                                const branchId =
                                    userDetail.companyBranchId || userDetail.branchID || '';
                                const employeeId = userDetail.employeId ?? null;
                                const processedRoles = userDetail.employeeRoleLoginDtos ?? [];
                                const processedMenus = this.processMenus(processedRoles);

                                const finalUser = {
                                    ...userDetail,
                                    employeeRoleLoginDtos: processedRoles,
                                    companyBranchId: branchId,
                                    employeId: employeeId,
                                };

                                sessionStorage.setItem('menus', JSON.stringify(processedMenus));
                                sessionStorage.setItem('user', JSON.stringify(finalUser));
                                if (loginResponse?.employee?.tenantSchema) {
                                    sessionStorage.setItem('tenantSchema', loginResponse.employee.tenantSchema);
                                }
                                this.accountService.setUser(finalUser);
                                this.accountService.setMenuData(processedMenus);
                                this.callInitialSetupStatus(branchId).subscribe({
                                    next: (res: any) => {
                                        if (res && res.isSetupComplete === false) {
                                            this.router.navigate(['/initial-setup'], {
                                                replaceUrl: true,
                                            });
                                        } else {
                                            this.router.navigate(['/welcome'], {
                                                replaceUrl: true,
                                            });
                                        }
                                        this.loading = false;
                                    },
                                    error: () => {
                                        console.error('Error fetching setup status');
                                        this.router.navigate(['/welcome'], {
                                            replaceUrl: true,
                                        });
                                        this.loading = false;
                                    },
                                });
                            } else {
                                const msg = 'Invalid credentials!';
                                this.error = msg;
                                this.notificationService.showError(msg);
                                this.loading = false;
                            }
                        },
                        error: (detailError) => {
                            const msg = this.handleError(
                                detailError,
                                'Failed to load user details.'
                            );
                            this.error = msg;
                            this.notificationService.showError(msg);
                            this.loading = false;
                        },
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
        return this.accountService.step('InitialSetup/Initialstatus', params);
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
