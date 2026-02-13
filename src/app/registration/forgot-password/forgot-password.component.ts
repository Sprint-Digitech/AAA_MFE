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
import { map, catchError, takeUntil, finalize, timeout } from 'rxjs/operators';
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
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.notificationService.showError('Please fill all required fields.');
      return;
    }

    const email = this.forgotPasswordForm.get('email')?.value;
    this.isLoading = true;
    this.status = 'idle';
    this.message = '';

    // First check if email is registered
    this.checkEmailExists(email).subscribe({
      next: (exists) => {
        if (!exists) {
          this.status = 'error';
          this.message = 'Email not registered.';
          this.notificationService.showError(this.message);
          this.isLoading = false;
          return;
        }

        // Email exists, proceed with forgot password
        this.passwordResetService
          .forgotPassword(`api/Account/ForgotPassword?email=${email}`, {})
          .subscribe({
            next: () => {
              this.status = 'success';
              this.message =
                'Password reset link has been sent to your email address.';
              this.notificationService.showSuccess(this.message);
              this.isLoading = false;
            },
            error: (error: any) => {
              this.status = 'error';
              if (error?.error?.errors?.[0]) {
                this.message = error.error.errors[0];
              } else {
                this.message = 'Failed to send reset link. Please try again.';
              }
              this.notificationService.showError(this.message);
              this.isLoading = false;
            },
          });
      },
      error: () => {
        this.status = 'error';
        this.message = 'Failed to verify email. Please try again.';
        this.notificationService.showError(this.message);
        this.isLoading = false;
      },
    });
  }

  checkEmailExists(email: string): Observable<boolean> {
    const headers = new HttpHeaders({
      'X-Tenant-Schema': 'dbo',
    });
    const url = `${this.passwordResetService.environment.urlAddress}/api/Employee/GetAllRegisteredEmails`;
    console.log('Checking email exists - URL:', url); // DEBUG
    console.log('Email to check:', email);
    return this.http.get<string[]>(url, { headers }).pipe(
      timeout(10000),
      map((emails: string[]) => {
        console.log('Received emails:', emails);
        return emails.some(
          (registeredEmail: string) =>
            registeredEmail?.trim().toLowerCase() === email.trim().toLowerCase()
        );
      }),
      catchError((error) => {
        console.error('Email check API error:', error); // DEBUG
        return of(false);
      })
    );
  }

  get email() {
    return this.forgotPasswordForm.get('email');
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
