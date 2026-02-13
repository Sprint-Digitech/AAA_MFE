import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';

@Component({
  selector: 'app-company-group-add',
  standalone: true,
  imports: [AddUpdateFormComponent, CommonModule],
  templateUrl: './company-group-add.component.html',
  styleUrls: ['./company-group-add.component.scss'],
})
export class CompanyGroupAddComponent {
  CompanyGroupData: any;
  addCompanyFormConfig!: FormConfig;
  companyGroupId: any;
  addCompanyGroupFormLoaded: boolean = false;

  constructor(
    private service: AccountService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.getCompanyGroup(); // Fetch list first for validation logic

    this.route.params.subscribe((params) => {
      this.companyGroupId = params['id'];

      if (this.companyGroupId) {
        // Edit Mode: Hide form, fetch data
        this.addCompanyGroupFormLoaded = false;
        this.getData(this.companyGroupId);
      } else {
        // Add Mode: Initialize empty and show
        this.initializeFormConfig();
        this.addCompanyGroupFormLoaded = true;
      }
    });
  }

  initializeFormConfig(initialValues?: any) {
    const isUpdate = !!this.companyGroupId;

    this.addCompanyFormConfig = {
      formTitle: isUpdate ? 'Update Company Group' : 'Add Company Group',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'companyGroupName',
              label: 'Company Group Name',
              type: 'text',
              maxLength: 50,
              placeholder: 'e.g., Company Group Name',
              colSpan: 1,
              // FIX: Safely access the value
              value: initialValues?.companyGroupName || '',
              validations: [
                { type: 'required', message: 'Company Group Name is required' },
                { type: 'maxLength', value: 50, message: 'Max 50 characters' },
                {
                  type: 'pattern',
                  value: '^[a-zA-Z\\s]*$',
                  message: 'Company Group Name should contain alphabets only',
                },
                {
                  type: 'custom',
                  message: 'Name cannot contain only whitespace',
                  validator: (value: any) => {
                    return (value || '').trim().length > 0;
                  },
                },
                {
                  type: 'custom',
                  message: 'Company Group Name already exists',
                  validator: (value: any) => {
                    return this.isNameUnique(value);
                  },
                },
              ],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              // FIX: Ensure 1 becomes "1" for radio matching
              value:
                initialValues?.status !== undefined &&
                initialValues?.status !== null
                  ? String(initialValues.status)
                  : '1',
              options: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
              ],
              validations: [
                { type: 'required', message: 'Status is required' },
              ],
            },
          ],
        },
      ],
      submitLabel: isUpdate ? 'Update' : 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data: any) => this.sendData(data),
      onCancel: () => this.goBack(),
    };
  }

  getData(id: string) {
    this.companyGroupId = id;
    console.log('Fetching data for ID:', id);

    this.service
      .get(`api/company-branch/GetCompanyGroup?id=${this.companyGroupId}`)
      .subscribe({
        next: (response: any) => {
          console.log('Raw API Response:', response);

          // 1. EXTRACT DATA FROM ARRAY
          let dataToUse;
          if (Array.isArray(response) && response.length > 0) {
            dataToUse = response[0]; // Take the first item
          } else {
            dataToUse = response; // Fallback if it is not an array
          }

          console.log('Data to use for patching:', dataToUse);

          // 2. Initialize config with the extracted object
          this.initializeFormConfig(dataToUse);

          // 3. Force Re-render
          this.addCompanyGroupFormLoaded = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.addCompanyGroupFormLoaded = true;
            this.cdr.detectChanges();
          }, 50);
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'An error occurred';
          if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
          } else {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          }
          this.notificationService.showError(errorMessage);
        },
      });
  }

  isNameUnique(value: any): boolean {
    if (!value || !this.CompanyGroupData) return true;
    const enteredName = value.trim().toLowerCase();
    const isDuplicate = this.CompanyGroupData.some((group: any) => {
      const groupName = group.companyGroupName.toLowerCase();
      if (
        this.companyGroupId &&
        group.id === this.companyGroupId // Note: Adjusted to match your JSON "id"
      ) {
        return false;
      }
      return groupName === enteredName;
    });
    return !isDuplicate;
  }

  getCompanyGroup() {
    this.service.get('api/company-branch/GetCompanyGroup').subscribe({
      next: (data: any) => {
        this.CompanyGroupData = data;
      },
    });
  }

  sendData(formValues: any) {
    const payload = {
      id: this.companyGroupId ?? undefined,
      companyGroupName: String(formValues.companyGroupName || '').trim(),
      status: Number(formValues.status), // API sends number, likely expects number back
      email: 'rastogiakshat10@gmail.com', // Preserving email if required, or handle via form
    };

    const apiCall = this.companyGroupId
      ? this.service.update('api/company-branch/updateCompanyGroup', payload)
      : this.service.post('api/CompanyGroup/CreateCompanyGroup', payload);

    apiCall.subscribe({
      next: (data) => {
        this.notificationService.showSuccess(
          this.companyGroupId ? 'Updated Successfully' : 'Saved Successfully',
        );
        this.addCompanyGroupFormLoaded = false;
        setTimeout(() => {
          this.router.navigate(['company/companyGroup']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.showError('Error saving data');
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
