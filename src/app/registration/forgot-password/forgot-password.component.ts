import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  AbstractControl,
  AsyncValidatorFn,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { Observable, of, Subject, Subscription } from 'rxjs';
import {
  HttpErrorResponse,
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { map, catchError, takeUntil, finalize, timeout, first } from 'rxjs/operators';
import { AccountService } from '../../shared/services/account.service';
import { NotificationService } from '../../shared/services/notification.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  backgroundImage =
    'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),url(assets/img/teamless.jpg)';
  forgotPasswordForm: FormGroup;
  isLoading = false;
  status: 'idle' | 'success' | 'error' = 'idle';
  message = '';

  constructor(
    private fb: FormBuilder,
    private passwordResetService: AccountService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {
    console.log('ForgotPasswordComponent: constructor');
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    console.log('ForgotPasswordComponent: ngOnInit');
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('--- FORGOT PASSWORD SUBMIT CALLED ---');
    console.log('Form State Valid:', this.forgotPasswordForm.valid);
    console.log('Form Values:', this.forgotPasswordForm.value);

    if (this.forgotPasswordForm.invalid) {
      console.warn('Form is invalid. Errors:', this.forgotPasswordForm.errors);
      this.forgotPasswordForm.markAllAsTouched();
      this.notificationService.showError('Please enter a valid email address.');
      return;
    }

    const emailValue = this.forgotPasswordForm.get('email')?.value;
    console.log('Input Email:', emailValue);

    this.isLoading = true;
    this.status = 'idle';
    this.message = '';

    // Step 1: Verify email exists
    console.log('Verifying email registration...');
    this.checkEmailExists(emailValue).subscribe({
      next: (exists) => {
        console.log('Email exists check result:', exists);
        if (!exists) {
          this.status = 'error';
          this.message = 'Email is not registered in our system.';
          this.notificationService.showError(this.message);
          this.isLoading = false;
          return;
        }

        // Step 2: Call forgot password API
        console.log('Email found. Proceeding with Reset Link request...');
        this.passwordResetService
          .forgotPassword(`api/Account/ForgotPassword?email=${emailValue}`, {})
          .pipe(first())
          .subscribe({
            next: (res: any) => {
              console.log('ForgotPassword API internal success:', res);
              this.status = 'success';
              this.message = 'Reset link has been sent to your email address.';
              this.notificationService.showSuccess(this.message);
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('ForgotPassword API error details:', error);
              this.status = 'error';
              // Parse error message carefully
              let errorMsg = 'Failed to send reset link. Please try again.';
              if (error?.error) {
                if (typeof error.error === 'string') errorMsg = error.error;
                else if (error.error.message) errorMsg = error.error.message;
                else if (error.error.errors && error.error.errors[0]) errorMsg = error.error.errors[0];
              }
              this.message = errorMsg;
              this.notificationService.showError(this.message);
              this.isLoading = false;
            },
          });
      },
      error: (err) => {
        console.error('checkEmailExists subscription error:', err);
        this.status = 'error';
        this.message = 'Service unavailable. Please try again later.';
        this.notificationService.showError(this.message);
        this.isLoading = false;
      },
    });
  }

  checkEmailExists(email: string): Observable<boolean> {
    const headers = new HttpHeaders({
      'X-Tenant-Schema': 'dbo',
    });
    const url = `${this.passwordResetService.environment.urlAddress}/api/Account/GetAllRegisteredEmails`;
    console.log('Calling checkEmailExists URL:', url);

    return this.http.get<string[]>(url, { headers }).pipe(
      timeout(10000),
      map((emails: string[]) => {
        console.log('Total emails retrieved:', emails?.length);
        if (!emails || !Array.isArray(emails)) return false;

        const found = emails.some(
          (registeredEmail: string) =>
            registeredEmail?.trim().toLowerCase() === email?.trim().toLowerCase()
        );
        return found;
      }),
      catchError((error) => {
        console.error('checkEmailExists API failure:', error);
        return of(false);
      })
    );
  }
}

//  checkEmailExists(email: string): Observable<boolean> {
//     const headers = new HttpHeaders({
//       'X-Tenant-Schema': 'dbo'
//     });
//     const url = `${this.envUrl.urlAddress}api/Employee/GetAllRegisteredEmails`;

//     return this.http.get<string[]>(url, { headers }).pipe(
//       map((emails: string[]) => {
//         return emails.some((registeredEmail: string) =>
//           registeredEmail?.trim().toLowerCase() === email.trim().toLowerCase()
//         );
//       }),
//       catchError(() => of(false))
//     );
//   }
// this.passwordResetService.requestPasswordReset(email).subscribe({
//   next: () => {
//     this.status = 'success';
//     this.message = 'Password reset link has been sent to your email address.';
//     this.isLoading = false;
//   },
//   error: (error:any) => {
//     this.status = 'error';
//     this.message = 'An error occurred. Please try again later.';
//     this.isLoading = false;
//     console.error('Password reset error:', error);
//   }
// });
// this.message = error?.error?.message || 'An error occurred. Please try again later.';
// if (typeof error.error === 'string' && error.error === 'User not found.') {
//    this. message = 'Email is invalid.';
// } else if (error.error?.message) {
//   this.message = error.error.message;
// } else {
//   this.message = 'An error occurred. Please try again later.';
// }

// this._snackBar.open(message, 'Close', {
//   duration: 5000,
//   panelClass: ['snackbar-error']
// //   this._snackBar.open('Password reset link has been sent to your email address.', 'Close', {
// duration: 5000,
// panelClass: ['snackbar-success']
//  });
// onSubmit(): void {
//   if (this.forgotPasswordForm.invalid) {
//     return;
//   }
//   const email = this.forgotPasswordForm.get('email')?.value;
//   this.isLoading = true;
//   this.status = 'idle';
//   this.message = '';
//    this.checkEmailExists(email).subscribe({
//     next: (exists) => {
//       if (!exists) {
//         this.status = 'error';
//         this.message = 'Email not registered in this tenant.';
//         this.notificationService.showError(this.message);
//         this.isLoading = false;
//         return;
//       }
//   const body = { email: email };

//   this.employeeData.forgotPassword(`api/Account/ForgotPassword?email=${email}`, {}).subscribe({
//     next: () => {
//       this.status = 'success';
//       this.message = 'Password reset link has been sent to your email address.';
//      this.notificationService.showSuccess(this.message);
//       this.isLoading = false;
//     },
//     error: (error: any) => {
//       this.status = 'error';
//       this.isLoading = false;
//       if (error?.error?.errors?.[0]) {
//         this.message = error.error.errors[0];  // "User not found."
//         this.notificationService.showError(this.message);
//         return;
//       }

//       // Fallbacks
//       this.message = 'Email not registered.';
//       this.notificationService.showError(this.message);
//    }
//       });
//     },
//     error: () => {
//       this.status = 'error';
//       this.message = 'Failed to verify email. Please try again.';
//       this.notificationService.showError(this.message);
//       this.isLoading = false;
//     }
//   });
// }
// get email() {
//   return this.forgotPasswordForm.get('email');
// }
