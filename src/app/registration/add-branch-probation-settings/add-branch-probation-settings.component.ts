import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { NotificationService } from '../../shared/services/notification.service';
import { UtilityService } from '../../shared/services/utility.service';
import { AccountService } from '../../shared/services/account.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-add-branch-probation-settings',
  imports: [AddUpdateFormComponent,CommonModule],
  templateUrl: './add-branch-probation-settings.component.html',
  styleUrl: './add-branch-probation-settings.component.scss'
})
export class AddBranchProbationSettingsComponent {
 formConfig!: FormConfig;
  companyId: any;
  branchesList: any[] = [];
  departmentList: any[] = [];
  designationList: any[] = [];
  isEditMode = false;
  branchProbationSettingId: string | null = null;
 isLoading = true; // Add loading state

  constructor(
    private router: Router,
    private service: AccountService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('Component initialized'); // Debug log
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.companyId = user.companyId;

      if (this.companyId) {
        this.initializeData();
      } else {
        console.error('Company ID not found in sessionStorage');
        this.notificationService.showError('Company ID not found');
      }
    } else {
      console.error('User data not found in sessionStorage');
      this.notificationService.showError('User data not found');
    }
  }

  loadExistingAndBuildForm(id: string) {
    this.service.get(`api/company-branch/GetBranchProbationSetting?id=${id}`).subscribe({
      next: (response: any) => {
        console.log('Loaded existing data:', response); // Debug log
        const data = Array.isArray(response) ? response[0] : response;

          if (!data) {
            this.notificationService.showError('No data found for this ID');
            return;
          }

          console.log('Extracted data object:', data);
        // Build form with existing values
        this.buildFormConfig(data);
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
      },
      error: (err) => {
        console.error('Error fetching branch probation setting:', err);
        this.notificationService.showError('Error fetching branch probation setting');
        this.isLoading = false;
      }
    });
  }

  private initializeData(): void {
    this.branchProbationSettingId = this.route.snapshot.paramMap.get('branchProbationSettingId');
    const updateRoute = this.isUpdateRoute();

    console.log('Is Update Route:', updateRoute); // Debug log
    console.log('Branch Probation Setting ID:', this.branchProbationSettingId); // Debug log

    // Use forkJoin to run all API calls in parallel
    // FIXED: Provide fallback empty arrays if APIs are not ready
    forkJoin({
      branches: this.service.get(`api/company-branch/GetCompanyBranch?companyId=${this.companyId}`)
        .pipe(catchError(err => {
          console.error('Error loading branches:', err);
          return of([]); // Return empty array on error
        })),
      departments: this.service.get(`api/Department/DepartmentList`)
        .pipe(catchError(err => {
          console.error('Error loading departments:', err);
          return of([]); // Return empty array on error
        })),
      designations: this.service.get(`api/Designation/DesignationList`)
        .pipe(catchError(err => {
          console.error('Error loading designations:', err);
          return of([]); // Return empty array on error
        }))
    }).subscribe({
      next: (results: any) => {
        console.log('API Results:', results); // Debug log

        // 1. Map Branches
        this.branchesList = Array.isArray(results.branches) 
          ? results.branches.map((b: any) => ({
              label: b.companyBranchName || b.name,
              value: b.id.toString()
            }))
          : [];

        // 2. Map Departments (Using departmentName and departmentId)
        this.departmentList = Array.isArray(results.departments)
          ? results.departments.map((d: any) => ({
              label: d.departmentName,
              value: d.departmentId
            }))
          : [];

        // 3. Map Designations (Using designationName and id)
        this.designationList = Array.isArray(results.designations)
          ? results.designations.map((ds: any) => ({
              label: ds.designationName,
              value: ds.id
            }))
          : [];

        console.log('Mapped Lists:', {
          branches: this.branchesList,
          departments: this.departmentList,
          designations: this.designationList
        }); // Debug log

        // 4. Handle Edit Mode vs Add Mode
        if (updateRoute && this.branchProbationSettingId) {
          this.isEditMode = true;
          this.loadExistingAndBuildForm(this.branchProbationSettingId);
        } else {
          this.isEditMode = false;
          this.buildFormConfig();
          this.isLoading = false;
          this.cdr.detectChanges(); // IMPORTANT: Trigger change detection
        }
      },
      error: (err) => {
        console.error('Error loading dropdown data:', err);
        this.notificationService.showError('Error loading form data');
        this.isLoading = false;
        
        // Build form anyway with empty dropdowns
        this.buildFormConfig();
        this.cdr.detectChanges();
      }
    });
  }

  buildFormConfig(data?: any): void {
    this.formConfig = {
      formTitle: this.isEditMode ? 'Update Branch Probation Setting' : 'Add Branch Probation Setting',
      submitLabel: this.isEditMode ? 'Update' : 'Save',
      cancelLabel: 'Cancel',
      maxColsPerRow: 2, // Adjust layout as needed
      sections: [
        {
          fields: [
            // Hidden ID Field
            {
              name: 'branchProbationSettingId',
              label: '',
              type: 'text',
              hidden: true,
              value: data?.branchProbationSettingId || ''
            },
            // Branch Select
            {
              name: 'companyBranchId',
              label: 'Branch',
              type: 'select',
              required: true,
              options: this.branchesList,
              value: data?.companyBranchId || '',
              validations: [{ type: 'required', message: 'Branch is required' }]
            },
            {
              name: 'departmentId',
              label: 'Department',
              type: 'select',
              required: true,
              options: this.departmentList,
              value: data?.departmentId || '',
            },
            {
              name: 'designationId',
              label: 'Designation',
              type: 'select',
              required: true,
              options: this.designationList,
              value: data?.designationId || '',
            },
            // Probation Days
            {
              name: 'probationPeriodDays',
              label: 'Probation Period (Days)',
              type: 'number',
              required: true,
              value: data?.probationPeriodDays || 0,
              validations: [
                { type: 'required' },
                { type: 'min', value: 0, message: 'Days cannot be negative' }
              ]
            },
            // Mandatory Checkbox
            {
              name: 'isProbationMandatory',
              label: 'Is Probation Mandatory?',
              type: 'radio',
              layout: 'horizontal',
              value: data ? data.isProbationMandatory : true,
              options: [                   // Add options
                { label: 'Yes', value: true },
                { label: 'No', value: false }
              ],
              colSpan: 1
            },
            // Status Checkbox
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              // Normalize integer status from API (1/0) to boolean for checkbox
              value: data?.status || 1,
              options: [                   // Add options
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 }
              ],
            }
          ]
        }
      ],
      onSubmit: (formData) => this.handleSubmit(formData),
      onCancel: () => this.goBack(),
    };
  }

  handleSubmit(formValue: any): void {
    // Logic extracted from your original sendBranchProbationForm
    const isNewRecord = !formValue.branchProbationSettingId;

    const payload = {
      branchProbationSettingId: formValue.branchProbationSettingId || UtilityService.generateGuid(),
      companyBranchId: formValue.companyBranchId,
      departmentId: formValue.departmentId || null,
      designationId: formValue.designationId || null,
      probationPeriodDays: formValue.probationPeriodDays,
      isProbationMandatory: formValue.isProbationMandatory,
      status: formValue.status
    };

    if (isNewRecord) {
      this.service.post('api/company-branch/CreateBranchProbationSetting', payload)
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Branch probation setting created successfully');
            this.goBack();
          },
          error: (err) => {
            console.error('Error creating branch probation setting:', err);
            this.notificationService.showError('Failed to create setting');
          }
        });
    } else {
      const id = formValue.branchProbationSettingId;
      this.service.update(`api/company-branch/UpdateBranchProbationSetting?id=${id}`, payload)
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Branch probation setting updated successfully');
            this.goBack();
          },
          error: (err) => {
            console.error('Error updating branch probation setting:', err);
            this.notificationService.showError('Failed to update setting');
          }
        });
    }
  }

  handleValidationError(message: string) {
    this.notificationService.showError(message);
  }

  goBack(): void {
    this.router.navigate(['/branch-probation-setting']);
  }

  private isUpdateRoute(): boolean {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    return path.toLowerCase().includes('update');
  }
}
