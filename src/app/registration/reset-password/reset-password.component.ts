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
import { ValidationSchema } from '@fovestta2/validation-engine';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FvEntryFieldComponent } from '@fovestta2/web-angular';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    FvEntryFieldComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  emailSchema: ValidationSchema = {
    controlType: 'EntryField',
    errorPriority: ['required', 'email'],
    rules: [
      { name: 'required', params: { enabled: true }, errorKey: 'ERR_REQUIRED' },
      { name: 'email', params: { enabled: true }, errorKey: 'ERR_EMAIL' },
    ],
  };

  passwordSchema: ValidationSchema = {
    controlType: 'EntryField',
    errorPriority: ['required', 'pattern'],
    rules: [
      { name: 'required', params: { enabled: true }, errorKey: 'ERR_REQUIRED' },
      {
        name: 'pattern',
        params: {
          pattern:
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        },
        errorKey: 'ERR_PATTERN',
      },
      {
        name: 'minLength',
        params: { minLength: 8 },
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
        name: 'custom',
        params: { custom: 'mismatch' },
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

    if (pass !== confirm) {
      return { mismatch: true };
    }
    return null;
  }

  onSubmit() {
    console.log('tenantSchema =>', this.tenantSchema);
    console.log('token =>', this.token);
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.notificationService.showError('Please fill all required fields.');
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
                    `api/Account/GetEmployeeLoginDetail?email=${email}`,
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
// const body = {
//   email: this.email,
//   token: this.token,
//   newPassword: newPassword,
//   confirmPassword: confirmPassword
// };
// custom validator
// passwordsMatch(group: FormGroup) {
//   const newPass = group.get('newPassword')?.value;
//   const confirmPass = group.get('confirmPassword')?.value;
//   return newPass === confirmPass ? null : { mismatch: true };
// }
//   onSubmit() {
//     if (this.resetPasswordForm.invalid) {
//       this.resetPasswordForm.markAllAsTouched();
//        this.notificationService.showError('Please fill all required fields.');
//       return;
//     }

//     this.isLoading = true;
//     this.isError = false;

//     const newPassword = this.resetPasswordForm.get('newPassword')?.value;
//     const confirmPassword = this.resetPasswordForm.get('confirmPassword')?.value;

//     const queryParams = `?email=${encodeURIComponent(this.email)}&token=${encodeURIComponent(this.token)}&newPassword=${encodeURIComponent(newPassword)}&confirmPassword=${encodeURIComponent(confirmPassword)}`;
//     this.employeeData.resetPassword(`api/Account/ResetPassword${queryParams}`, {}).pipe(first()).subscribe({
//       next: (response) => {
//         this.message = 'Password reset successfully.';
//         this.isLoading = false;
//         this.notificationService.showSuccess('Password reset successfully');

//         setTimeout(() => {
//           this.router.navigate(['/authentication/welcome-user']);
//         }, 2000);
//       },
//   error: (err) => {
//     this.isLoading = false;
//         this.isError = true;
//    console.log('Full Error Object:', err);
//         console.log('Error.error type:', typeof err?.error);
//         console.log('Error.error:', err?.error);

//         let errorMessages: string[] = [];
//         let errorData = err?.error;

//         // If error is a string, try to parse it as JSON
//         if (typeof errorData === 'string') {
//           try {
//             errorData = JSON.parse(errorData);
//             console.log('Parsed error data:', errorData);
//           } catch (e) {
//             console.log('Failed to parse error as JSON');
//           }
//         }

//         // Priority 1: Check for array with description (e.g., [{ "description": "User not found." }])
//         if (Array.isArray(errorData)) {
//           errorData.forEach((item: any) => {
//             if (item?.description) {
//               errorMessages.push(item.description);
//             }
//           });
//         }
//         // Priority 2: Check for direct description property
//         else if (errorData?.description) {
//           errorMessages.push(errorData.description);
//         }
//         // Priority 3: Check for validation errors object
//         else if (errorData?.errors && typeof errorData.errors === 'object') {
//           Object.keys(errorData.errors).forEach(key => {
//             const messages = errorData.errors[key];
//             console.log(`Field '${key}' errors:`, messages);

//             if (Array.isArray(messages)) {
//               messages.forEach((msg: any) => {
//                 if (msg && typeof msg === 'string') {
//                   errorMessages.push(msg);
//                 }
//               });
//             }
//           });
//         }
//         // Priority 4: Check for single message
//         else if (errorData?.message) {
//           errorMessages.push(errorData.message);
//         }
//         // Priority 5: Check for title
//         else if (errorData?.title) {
//           errorMessages.push(errorData.title);
//         }

//         // Set final message
//         if (errorMessages.length > 0) {
//           this.apiMessage = errorMessages.join('\n');
//         } else {
//           this.apiMessage = err?.statusText || 'An error occurred. Please try again.';
//         }

//         console.log('Final Error Messages:', errorMessages);
//         console.log('Final API Message:', this.apiMessage);

//         // Show error notification
//         this.notificationService.showError(this.apiMessage);
//       }
//     });
//   }

// }

// if (params['tenantSchema']) {
//   // user object me tenantSchema store kar sakte ho
//   sessionStorage.setItem('tenantSchema', params['tenantSchema']);
//   this.user = { ...this.user, tenantSchema: params['tenantSchema'] };
// }
