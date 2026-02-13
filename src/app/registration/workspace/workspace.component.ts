import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { AccountService } from '../../shared/services/account.service';

import { NotificationService } from '../../shared/services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-workspace',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
})
export class WorkspaceComponent {
  overviewData = {
    totalCompanies: 0,
    payrollComplete: 0,
    inProgress: 0,
    pending: 0,
  };
  showDropdowns = false;
  errorMessage: string | null = null;
  companyData: any[] = [];
  constructor(
    private router: Router,
    private accountService: AccountService,
    private dialogueService: DialogService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit() {
    this.getCompany();
  }

  handleSearch(event: any) {}
  toggleDropdowns() {
    this.showDropdowns = !this.showDropdowns;
  }
  existingCompany() {
    this.router.navigate(['company/add-existing-company']);
  }
  getCompany() {
    const tenantName = sessionStorage.getItem('tenantSchema');
    if (!tenantName) {
      this.errorMessage = 'Tenant information missing. Please log in again.';
      return;
    }

    // Add cache-busting parameter to ensure fresh data
    const timestamp = new Date().getTime();
    const route = `api/GroupTenant/groupbytenant?groupTenantName=${tenantName}`;

    // Add cache-busting headers to prevent caching
    const headers = new HttpHeaders()
      .set('Cache-Control', 'no-cache, no-store, must-revalidate')
      .set('Pragma', 'no-cache')
      .set('Expires', '0')
      .set('X-No-Cache', 'true');

    // Use getDataWithBranchId which supports headers
    this.accountService.getDataWithBranchId(route, { headers }).subscribe({
      next: (res: any) => {
        console.log('Company API Response:', res);
        console.log('Response type:', typeof res);
        console.log('Is array?', Array.isArray(res));

        // Clear previous data first - create new array reference to trigger change detection
        this.companyData = [];
        this.errorMessage = null;

        if (res && Array.isArray(res)) {
          // Flatten the response to get all companies
          const flattened = res.flatMap((group: any) => {
            console.log('Processing group:', group);
            return group.employees || [];
          });

          console.log('Flattened companies:', flattened);
          console.log('Flattened count:', flattened.length);

          // Create new array reference to ensure change detection
          this.companyData = [...flattened];
        } else {
          this.companyData = [];
        }

        // Update overview counts after data is loaded
        this.updateOverviewCounts();

        // Force change detection to ensure UI updates
        this.cdr.detectChanges();

        console.log(
          '✅ Company list refreshed. Total companies:',
          this.companyData.length,
        );
        console.log(
          'Company names:',
          this.companyData.map((c: any) => c.companyName || c.email),
        );
      },
      error: (err: any) => {
        console.error('❌ Error fetching company data:', err);
        this.errorMessage = 'Failed to load company data.';
        this.companyData = [];
        this.updateOverviewCounts(); // Update counts even on error to show 0
        this.cdr.detectChanges();
      },
    });
  }
  updateOverviewCounts() {
    this.overviewData.totalCompanies = this.companyData.length;

    this.overviewData.payrollComplete = this.companyData.filter(
      (c) => c.payStatus?.toLowerCase() === 'completed',
    ).length;

    this.overviewData.inProgress = this.companyData.filter(
      (c) =>
        c.payStatus?.toLowerCase() === 'inprogress' ||
        c.payStatus?.toLowerCase() === 'in progress',
    ).length;

    this.overviewData.pending = this.companyData.filter(
      (c) => c.payStatus?.toLowerCase() === 'pending',
    ).length;

    console.log('Overview Data:', this.overviewData);
  }
  openPayroll(emp: any) {
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const currentTenantSchema = sessionStorage.getItem('tenantSchema'); // <--- ONLY sessionStorage!
    const email = emp?.email;

    if (!currentTenantSchema || !email) {
      alert('Tenant or email not found in session.');
      return;
    }

    const payload = {
      email: email,
      groupTenant: currentTenantSchema, // Always current tab tenant schema!
      rememberMe: true,
    };

    console.log('🔹 Sending loginGroupTenant payload:', payload);

    this.accountService.loginGroupTenant(payload).subscribe({
      next: (response: any) => {
        console.log('LoginGroupTenant response:', response);

        if (response?.token && response?.employee?.tenantSchema) {
          const newTenantSchema = response.employee.tenantSchema;

          // Update sessionStorage only
          sessionStorage.setItem('activeTenantSchema', newTenantSchema);
          sessionStorage.setItem('tenant_token', response.token);

          const updatedUser = { ...currentUser, tenantSchema: newTenantSchema };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));

          console.log('🟢 Switched to new tenant:', newTenantSchema);

          // Open new tab with tenant and email params
          const queryParams = new URLSearchParams({
            tenant: newTenantSchema,
            email: email,
          }).toString();

          const url = `/dist/#/authentication/welcome-user?${queryParams}`;
          window.open(url, '_blank');
        } else {
          alert('Failed to switch tenant. Token not received.');
        }
      },
      error: (err: any) => {
        console.error('❌ Error while switching tenant:', err);
        alert('An error occurred while opening payroll.');
      },
    });
  }
  deleteCompany(company: any): void {
    if (!company?.email) {
      this.notificationService.showError(
        'Company email not found. Cannot remove.',
      );
      console.error('Missing email for company:', company);
      return;
    }

    this.dialogueService
      .openConfirmDialog(
        'Delete Company',
        `Are you sure you want to remove ${company.companyName}?`,
        'Remove',
        'Cancel',
      )
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          // Build URL with email query param
          const route = `api/Account/RemoveTenantControl?emailId=${encodeURIComponent(company.email)}`;

          this.accountService.delete(route).subscribe({
            next: (response: any) => {
              console.log('✅ API Response (200):', response);
              console.log('Response type:', typeof response);
              console.log('Response value:', response);

              // Handle different response types (string or object)
              let responseMessage = '';
              let responseText = '';

              if (typeof response === 'string') {
                responseText = response;
                responseMessage = response;
              } else if (response && typeof response === 'object') {
                // Try to extract message from object
                responseText = JSON.stringify(response);
                responseMessage =
                  response.message ||
                  response.Message ||
                  response.error ||
                  response.Error ||
                  '';

                // Check for common error indicators in response object
                if (
                  response.success === false ||
                  response.error ||
                  response.Error ||
                  (response.message &&
                    response.message.toLowerCase().includes('error')) ||
                  (response.Message &&
                    response.Message.toLowerCase().includes('error'))
                ) {
                  const errorMsg =
                    response.message ||
                    response.Message ||
                    response.error ||
                    response.Error?.Message ||
                    'Failed to remove company. Please try again.';
                  console.warn(
                    '⚠️ API returned 200 but with error in body:',
                    errorMsg,
                  );
                  this.notificationService.showError(errorMsg);
                  return;
                }
              } else {
                responseText = String(response || '');
                responseMessage = responseText;
              }

              // Normalize the response text for checking
              const normalizedResponse = responseText.toLowerCase().trim();
              const normalizedMessage = responseMessage.toLowerCase().trim();

              console.log('Normalized response:', normalizedResponse);

              // Check if response indicates success
              // The API might return "Tenant control removed successfully" or similar
              const isSuccess =
                normalizedResponse.includes('success') ||
                normalizedResponse.includes('successfully') ||
                normalizedResponse.includes('removed') ||
                normalizedResponse.includes('deleted') ||
                normalizedResponse.includes('tenant control') ||
                normalizedMessage.includes('success') ||
                normalizedMessage.includes('successfully') ||
                normalizedMessage.includes('removed') ||
                normalizedMessage.includes('deleted') ||
                response === null || // Some APIs return null on success
                response === '';

              console.log('Is success?', isSuccess);

              // Since API returns 200, treat it as success by default
              // Only show error if response explicitly contains error indicators
              const hasError =
                response &&
                typeof response === 'object' &&
                (response.success === false ||
                  response.error ||
                  response.Error ||
                  (response.message &&
                    response.message.toLowerCase().includes('error')) ||
                  (response.Message &&
                    response.Message.toLowerCase().includes('error')));

              if (hasError) {
                // Explicit error in response
                const errorMsg =
                  response.message ||
                  response.Message ||
                  response.error ||
                  response.Error?.Message ||
                  'Failed to remove company. Please try again.';
                console.warn(
                  '⚠️ API returned 200 but with error in body:',
                  errorMsg,
                );
                this.notificationService.showError(errorMsg);
              } else {
                // Success case - API returned 200, treat as success
                console.log('✅ Company removed successfully');

                // Remove company from local array immediately for instant UI update
                const deletedEmail = company.email?.toLowerCase().trim();
                const deletedCompanyName = company.companyName
                  ?.toLowerCase()
                  .trim();

                console.log(
                  'Removing company with email:',
                  deletedEmail,
                  'name:',
                  deletedCompanyName,
                );
                console.log(
                  'Current companies before removal:',
                  this.companyData.map((c: any) => ({
                    email: c.email,
                    name: c.companyName,
                  })),
                );

                // Filter out the deleted company - create new array reference
                this.companyData = this.companyData.filter((c: any) => {
                  const cEmail = c.email?.toLowerCase().trim();
                  const cName = c.companyName?.toLowerCase().trim();
                  const shouldKeep = !(
                    (deletedEmail && cEmail === deletedEmail) ||
                    (deletedCompanyName && cName === deletedCompanyName)
                  );
                  if (!shouldKeep) {
                    console.log('Removing company:', c.companyName || c.email);
                  }
                  return shouldKeep;
                });

                console.log(
                  'Companies after removal:',
                  this.companyData.length,
                );
                console.log(
                  'Remaining companies:',
                  this.companyData.map((c: any) => c.companyName || c.email),
                );

                // Update counts immediately
                this.updateOverviewCounts();
                // Force change detection
                this.cdr.detectChanges();

                this.notificationService.showSuccess(
                  responseMessage ||
                    responseText ||
                    `${company.companyName} has been removed successfully.`,
                );

                // Refresh the company list from server to ensure consistency
                setTimeout(() => {
                  this.getCompany();
                }, 300);
              }
            },
            error: (err: any) => {
              console.error('❌ HTTP Error deleting company:', err);
              console.error('Error status:', err?.status);
              console.error('Error body:', err?.error);

              // Extract error message from response
              let errorMessage = 'Failed to remove company. Please try again.';
              if (err?.error?.Message) {
                errorMessage = err.error.Message;
              } else if (err?.error?.message) {
                errorMessage = err.error.message;
              } else if (err?.error?.Error?.Message) {
                errorMessage = err.error.Error.Message;
              } else if (err?.error?.error) {
                errorMessage = err.error.error;
              } else if (err?.message) {
                errorMessage = err.message;
              }

              this.notificationService.showError(errorMessage);
            },
          });
        }
      });
  }
}
