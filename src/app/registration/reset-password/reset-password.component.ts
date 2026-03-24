import { Component } from '@angular/core';
import {
  FormGroup,
  Validators,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { first, forkJoin } from 'rxjs';
import { ValidationSchema, Validator } from '@fovestta2/validation-engine';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FvEntryFieldComponent, FvEmailFieldComponent, FvPasswordFieldComponent } from '@fovestta2/web-angular';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    ReactiveFormsModule,
    FvEntryFieldComponent,
    FvEmailFieldComponent,
    FvPasswordFieldComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  emailSchema: ValidationSchema = {
    controlType: 'EntryField',
    errorPriority: ['required', 'regex'],
    rules: [
      { name: 'required', params: { enabled: true }, errorKey: 'ERR_REQUIRED' },
      {
        name: 'regex',
        params: { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        errorKey: 'ERR_EMAIL'
      },
    ],
  };

  passwordSchema: ValidationSchema = {
    controlType: 'EntryField',
    errorPriority: ['required', 'minLength', 'regex'],
    rules: [
      { name: 'required', params: { enabled: true }, errorKey: 'ERR_REQUIRED' },
      {
        name: 'regex',
        params: {
          pattern:
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        },
        errorKey: 'ERR_PATTERN',
      },
      {
        name: 'minLength',
        params: { value: 8 },
        errorKey: 'ERR_MINLENGTH',
      },
    ],
  };

  confirmPasswordSchema: ValidationSchema = {
    controlType: 'EntryField',
    errorPriority: ['required', 'mismatch'],
    rules: [
      { name: 'required', params: { enabled: true }, errorKey: 'ERR_REQUIRED' },
      {
        name: 'mismatch',
        params: { enabled: true },
        errorKey: 'ERR_MISMATCH',
      },
    ],
  };

  backgroundImage =
    'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),url(assets/img/teamless.jpg)';
  resetPasswordForm: FormGroup;
  hideNew = true;
  hideConfirm = true;
  hideCurrent = true;
  loading = false;
  error = '';
  user: any | null = null;
  googleuser: any | null = null;
  loginData: any;
  googlelogin: any;
  employeeRoleLoginDtos: any;
  //user
  email: string = '';
  // currentPassword: string = 'Nemo@123';
  newPassword: string = '';
  token: string = '';
  //api/UI state
  isLoading = false;
  isError = false;
  apiMessage: string = '';
  message: string = '';
  tenantSchema: string | null = null;
  currentPassword: string = 'Nemo@123';

  get emailControl(): FormControl {
    return this.resetPasswordForm.get('email') as FormControl;
  }
  get newPasswordControl(): FormControl {
    return this.resetPasswordForm.get('newPassword') as FormControl;
  }
  get confirmPasswordControl(): FormControl {
    return this.resetPasswordForm.get('confirmPassword') as FormControl;
  }

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private http: HttpClient,
    private accountService: AccountService,
  ) {
    // Register custom rules to stop console warnings
    if (!Validator.hasRule('mismatch')) {
      Validator.registerRule({
        ruleName: 'mismatch',
        validate: () => ({ isValid: true, errorKey: null })
      });
    }
    if (!Validator.hasRule('email')) {
      Validator.registerRule({
        ruleName: 'email',
        validate: (val: any) => ({
          isValid: !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
          errorKey: 'ERR_EMAIL'
        })
      });
    }

    //get logged-in user
    const storedUser = JSON.parse(sessionStorage.getItem('user')!);
    if (storedUser) {
      this.user = storedUser;
      this.loginData = this.user;
      this.employeeRoleLoginDtos = this.user.employeeRoleLoginDtos[0];
      this.email = this.loginData?.email || '';
    } else {
      this.loginData = null;
    }

    const storedGoogleUser = localStorage.getItem('token');
    if (storedGoogleUser) {
      this.googleuser = JSON.parse(storedGoogleUser);
      this.googlelogin = this.googleuser;
    } else {
      this.googlelogin = null;
    }

    this.resetPasswordForm = this.formBuilder.group(
      {
        email: [
          { value: this.email, disabled: true },
          [Validators.required, Validators.email],
        ],
        // currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.email = params['email'];
        this.resetPasswordForm.get('email')?.setValue(this.email);
      }
      const schema = params['schema'] || params['tenantSchema'];
      if (schema) {
        this.tenantSchema = schema;
        sessionStorage.setItem('tenantSchema', schema);
      } else {
        // If no schema in URL, clear any existing schema in session
        this.tenantSchema = null;
        sessionStorage.removeItem('tenantSchema');
      }
      if (params['token']) {
        this.token = params['token']; // <-- save token
      }
    });
  }
  passwordMatchValidator(form: FormGroup) {
    const pass = form.get('newPassword')?.value;
    const confirm = form.get('confirmPassword')?.value;
    const confirmControl = form.get('confirmPassword');

    if (pass && confirm && pass !== confirm) {
      confirmControl?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      // If they match, clear the mismatch error but keep others (like required)
      const errors = confirmControl?.errors;
      if (errors) {
        delete errors['mismatch'];
        confirmControl?.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  }

  onSubmit() {
    console.log('--- ResetPasswordComponent: onSubmit triggered ---');
    console.log('Form Status:', this.resetPasswordForm.status);
    console.log('Form Validity:', this.resetPasswordForm.valid);
    console.log('Errors:', {
      email: this.emailControl.errors,
      password: this.newPasswordControl.errors,
      confirm: this.confirmPasswordControl.errors,
      baseForm: this.resetPasswordForm.errors
    });

    if (this.resetPasswordForm.invalid) {
      console.warn('Form is invalid, marking as touched...');
      this.resetPasswordForm.markAllAsTouched();
      this.notificationService.showError('Please correct the errors in the form.');
      return;
    }

    if (this.tenantSchema) {
      // CREATE PASSWORD FLOW
      this.createPasswordFlow();
    } else {
      // RESET PASSWORD FLOW
      this.resetPasswordFlow();
    }
  }
  createPasswordFlow() {
    this.isLoading = true;

    const newPassword = this.resetPasswordForm.get('newPassword')?.value;

    this.http
      .post(
        `${this.accountService.environment.urlAddress}/api/Account/ChangePassword`,
        {
          email: this.email,
          currentPassword: this.currentPassword, // default / backend handled
          newPassword: newPassword,
        },
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Password created successfully');

          this.accountService
            .login('api/Account/Login', {
              email: this.email,
              password: newPassword,
              rememberMe: false,
            })
            .pipe(first())
            .subscribe({
              next: (loginResponse) => {
                const email = loginResponse?.employee?.email;

                this.accountService
                  .logindetail(
                    `api/Account/GetEmployeeRoleDetail?email=${email}`,
                  )
                  .pipe(first())
                  .subscribe({
                    next: (userDetail) => {
                      sessionStorage.setItem(
                        'user',
                        JSON.stringify(userDetail),
                      );
                      this.accountService.setUser(userDetail);
                      this.isLoading = false;
                      this.router.navigate(['employee/employeeOnboarding']);
                    },
                    error: () => {
                      this.isLoading = false;
                      this.notificationService.showError(
                        'Failed to load user details',
                      );
                    },
                  });
              },
              error: () => {
                this.isLoading = false;
                this.notificationService.showError('Login failed');
              },
            });
        },
        error: (err) => {
          this.isLoading = false;
          this.notificationService.showError(
            err?.error || 'Create password failed',
          );
        },
      });
  }
  resetPasswordFlow() {
    this.isLoading = true;

    const newPassword = this.resetPasswordForm.get('newPassword')?.value;
    const confirmPassword =
      this.resetPasswordForm.get('confirmPassword')?.value;

    const queryParams =
      `?email=${encodeURIComponent(this.email)}` +
      `&token=${encodeURIComponent(this.token)}` +
      `&newPassword=${encodeURIComponent(newPassword)}` +
      `&confirmPassword=${encodeURIComponent(confirmPassword)}`;

    this.accountService
      .resetPassword(`api/Account/ResetPassword${queryParams}`, {})
      .pipe(first())
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.notificationService.showSuccess('Password reset successfully');
          this.router.navigate(['/authentication/welcome-user']);
        },
        error: (err) => {
          this.isLoading = false;
          this.notificationService.showError(
            err?.error || 'Reset password failed',
          );
        },
      });
  }
}
