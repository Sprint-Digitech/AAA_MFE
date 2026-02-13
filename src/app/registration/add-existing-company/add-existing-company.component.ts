import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AccountService } from '../../shared/services/account.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';

@Component({
  selector: 'app-add-existing-company',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule,
    AddUpdateFormComponent, // Import the library
    RouterModule,
  ],
  templateUrl: './add-existing-company.component.html',
  styleUrls: ['./add-existing-company.component.scss'],
})
export class AddExistingCompanyComponent implements OnInit {
  addCompanyConfig!: FormConfig;
  error = '';
  successMessage = '';

  constructor(
    private accountService: AccountService,
    private router: Router,
    private notificationService: NotificationService,
    private location: Location,
  ) {}

  ngOnInit() {
    // 1. Session and Role Validation
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      this.error = 'User not logged in.';
      return;
    }
    const user = JSON.parse(userData);
    const isAdmin = user.employeeRoleLoginDtos?.some(
      (role: any) => role.roleName === 'Admin',
    );
    if (!isAdmin) {
      alert('You can’t take control. Only Admin users can log in here.');
      sessionStorage.clear();
      return;
    }

    // 2. Initialize Form Configuration
    this.initializeFormConfig();
  }

  initializeFormConfig() {
    this.addCompanyConfig = {
      formTitle: 'Add Existing Company', // Title handled in HTML
      maxColsPerRow: 1, // Single column layout for login-style forms
      sections: [
        {
          fields: [
            {
              name: 'companyName',
              label: 'Company Name',
              type: 'text',
              colSpan: 1,
              placeholder: 'Enter a Company Name',
              validations: [
                { type: 'required', message: 'Company Name is required' },
              ],
            },
            {
              name: 'email',
              label: 'Admin User Id',
              type: 'email',
              colSpan: 1,
              placeholder: 'Username/email',
              validations: [
                { type: 'required', message: 'Email is required' },
                { type: 'email', message: 'Email must be a valid email' },
              ],
            },
          ],
        },
      ],
      submitLabel: 'Take a Control',
      cancelLabel: 'Cancel', // Can be hidden via CSS if needed
      onSubmit: (data) => this.submit(data),
      onCancel: () => {
        this.goBack();
      }, // Handled differently if needed, usually empty for this screen
    };
  }
  goBack() {
    this.location.back();
  }
  submit(data: any) {
    this.error = '';
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tenantSchema = userData.tenantSchema;

    if (!tenantSchema) {
      this.error = 'Tenant information not found in session storage.';
      return;
    }

    const isAdmin = userData.employeeRoleLoginDtos?.some(
      (r: any) => r.roleName === 'Admin',
    );
    if (!isAdmin) {
      this.error =
        "You can't take control — only Admin users can perform this action.";
      return;
    }

    const companyName = data.companyName;
    const email = data.email;

    // API Call (Your existing logic)
    this.accountService.put(email, tenantSchema, companyName).subscribe({
      next: (response: any) => {
        let responseMessage = '';
        let responseText = '';

        if (typeof response === 'string') {
          responseText = response;
          responseMessage = response;
        } else if (response && typeof response === 'object') {
          responseText = JSON.stringify(response);
          responseMessage =
            response.message ||
            response.Message ||
            response.error ||
            response.Error ||
            '';
        } else {
          responseText = String(response || '');
          responseMessage = responseText;
        }

        const normalizedResponse = responseText.toLowerCase().trim();
        const normalizedMessage = responseMessage.toLowerCase().trim();

        const isSuccess =
          normalizedResponse.includes('success') ||
          normalizedResponse.includes('successfully') ||
          normalizedResponse.includes('took control') ||
          normalizedMessage.includes('success') ||
          normalizedMessage.includes('successfully') ||
          normalizedMessage.includes('took control') ||
          responseText === 'You successfully took control.' ||
          responseText.trim() === 'You successfully took control.';

        if (isSuccess) {
          this.successMessage =
            responseMessage ||
            responseText ||
            'Tenant control updated successfully!';
          this.error = '';
          this.notificationService.showSuccess(
            responseMessage || responseText || 'Company added successfully!',
          );

          setTimeout(() => {
            this.router.navigate(['/company/workspace']);
          }, 500);
        } else {
          const errorMsg =
            responseMessage ||
            responseText ||
            'Failed to update tenant control.';
          this.error = errorMsg;
          this.successMessage = '';
          this.notificationService.showError(errorMsg);
        }
      },
      error: (err: any) => {
        let errorMessage = 'Failed to add company. Please try again.';

        if (err?.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error?.Message) {
            errorMessage = err.error.Message;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.Error?.Message) {
            errorMessage = err.error.Error.Message;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }

        this.error = errorMessage;
        this.successMessage = '';
        this.notificationService.showError(errorMessage);
      },
    });
  }
}
