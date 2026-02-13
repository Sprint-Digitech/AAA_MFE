import { Component } from '@angular/core';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NotificationService } from '../../shared/services/notification.service';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { AccountService } from '../../shared/services/account.service';
import { UtilityService } from '../../shared/services/utility.service';

@Component({
  selector: 'app-add-responsibility-arch-mapping-list',
  imports: [AddUpdateFormComponent],
  templateUrl: './add-responsibility-arch-mapping-list.component.html',
  styleUrls: ['./add-responsibility-arch-mapping-list.component.scss'],
})
export class AddResponsibilityArchMappingListComponent {
  addResponsibilityArchFormLoaded: boolean = false;
  addResponsibilityArchFormConfig!: FormConfig;
  isEditMode: boolean = false;
  responsibilityArchMappingId: string = '';

  branches: any[] = [];
  selectedBranch: any = 'All';
  selectedDesignation: any = 'All';
  selectedDepartment: any = 'All';
  designations: any[] = [];
  departments: any[] = [];
  responsibilities: any[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private responsibilityService: ResponsibilityService,
    private service: AccountService,
  ) {}
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.responsibilityArchMappingId = params['id'];
      }
      this.loadAllData();
    });
  }
  loadAllData() {
    // Use forkJoin to load all data simultaneously
    forkJoin({
      departments: this.service.get(`api/Department/DepartmentList`),
      branches: this.service.get('api/company-branch/GetCompanyBranch'),
      designations: this.service.get(`api/Designation/DesignationList`),
      responsibilities: this.responsibilityService.getResponsibilityList(
        'api/Responsibility/GetResponsibilities',
      ),
    }).subscribe({
      next: (results) => {
        // Set departments
        this.departments = [
          { departmentId: 'All', departmentName: 'All' },
          ...results.departments.map((d: any) => ({
            departmentId: d.departmentId,
            departmentName: d.departmentName,
          })),
        ];

        // Set branches
        this.branches = results.branches.map((branch: any) => ({
          id: branch.id,
          companyBranchName: branch.companyBranchName,
        }));

        // Set designations
        this.designations = [
          { id: 'All', designationName: 'All' },
          ...results.designations.map((d: any) => ({
            id: d.id,
            designationName: d.designationName,
          })),
        ];

        // Set responsibilities (only active ones)
        this.responsibilities = results.responsibilities.filter(
          (r: any) => r.status === 1,
        );

        console.log('Branches loaded:', this.branches);
        console.log('Departments loaded:', this.departments);
        console.log('Designations loaded:', this.designations);
        console.log('Responsibilities loaded:', this.responsibilities);

        // Now initialize form after all data is loaded
        if (this.isEditMode) {
          this.fetchResponsibilityArchMappingById(
            this.responsibilityArchMappingId,
          );
        } else {
          this.initializeFormConfig();
          this.addResponsibilityArchFormLoaded = true;
        }
      },
      error: (error) => {
        console.error('Error loading dropdown data:', error);
        this.notificationService.showError('Failed to load form data');
      },
    });
  }
  fetchResponsibilityArchMappingById(id: string) {
    this.responsibilityService.getResponsibilityArchMappingById(id).subscribe({
      next: (response: any) => {
        const initialValues = {
          branch: response.branchNames || [],
          department: response.departmentNames || [],
          designation: response.designationNames || [],
          responsibilityName: response.responsiblityMasterID || [], // Assuming API returns this
          status: response.status,
        };
        this.initializeFormConfig(initialValues);
        this.addResponsibilityArchFormLoaded = true;
      },
      error: (error) => {
        this.notificationService.showError(
          'Failed to fetch responsibility mapping details',
        );
        console.error('Error fetching responsibility mapping:', error);
        this.goBack();
      },
    });
  }
  initializeFormConfig(initialValues?: any) {
    this.addResponsibilityArchFormConfig = {
      formTitle: this.isEditMode
        ? 'Update Organizational Structure Mapping'
        : 'Add Organizational Structure Mapping',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'branch',
              label: 'Branch',
              type: 'select',
              colSpan: 1,
              value: initialValues?.branch || '',
              options: this.branches.map((b) => ({
                label: b.companyBranchName,
                value: b.id,
              })),
              validations: [
                { type: 'required', message: 'Branch is required' },
              ],
            },

            {
              name: 'department',
              label: 'Department',
              type: 'select',
              colSpan: 1,
              value: initialValues?.department || '',
              options: this.departments
                .filter((d) => d.departmentId !== 'All')
                .map((d) => ({
                  label: d.departmentName,
                  value: d.departmentId,
                })),
              validations: [
                { type: 'required', message: 'Department is required' },
              ],
            },
            {
              name: 'designation',
              label: 'Designation',
              type: 'select',
              maxLength: 50,
              colSpan: 1,
              value: initialValues?.designation || '',
              options: this.designations
                .filter((d) => d.id !== 'All')
                .map((d) => ({ label: d.designationName, value: d.id })),
              validations: [
                { type: 'required', message: 'Designation is required' },
              ],
            },
            {
              name: 'responsibilityName',
              label: 'Responsibility ',
              type: 'select',
              colSpan: 1,
              value: initialValues?.responsibilityName || '',
              options: this.responsibilities.map((r) => ({
                label: r.responsiblityDisplayName,
                value: r.responsiblityMasterID,
              })),
              validations: [
                {
                  type: 'required',
                  message: 'Responsibility Name is required',
                },
              ],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              value: initialValues
                ? String(UtilityService.normalizeStatus(initialValues.status))
                : '1',
              hidden: !this.isEditMode,
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
      submitLabel: this.isEditMode ? 'Update' : 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data: any) => this.onSubmit(data),
      onCancel: () => this.goBack(),
    };
  }

  loadResponsibilities() {
    this.responsibilityService
      .getResponsibilityList('api/Responsibility/GetResponsibilities')
      .subscribe({
        next: (data: any[]) => {
          console.log('responsibilities', data);
          this.responsibilities = data.filter((r) => r.status === 1); // Only active responsibilities
        },
        error: (error) => {
          console.error('Failed to load responsibilities', error);
        },
      });
  }
  onSubmit(data: any) {
    if (this.isEditMode) {
      this.updateResponsibilityArchMapping(data);
    } else {
      this.createResponsibilityArchMapping(data);
    }
  }

  createResponsibilityArchMapping(data: any) {
    const payload = {
      responsibilityArchMappingID: UtilityService.generateGuid(),
      branchNames: Array.isArray(data.branch) ? data.branch : [data.branch],
      departmentNames: Array.isArray(data.department)
        ? data.department
        : [data.department],
      designationNames: Array.isArray(data.designation)
        ? data.designation
        : [data.designation],
      responsiblityMasterID: data.responsibilityName,
      status: 1,
    };

    this.responsibilityService
      .createResponsibilityArchMapping(payload)
      .subscribe({
        next: (response) => {
          this.notificationService.showSuccess(
            'Responsibility mapping created successfully',
          );
          this.goBack();
        },
        error: (error) => {
          this.notificationService.showError(
            'Failed to create responsibility mapping',
          );
          console.error('Error creating responsibility mapping:', error);
        },
      });
  }

  updateResponsibilityArchMapping(data: any) {
    const payload = {
      responsibilityArchMappingID: this.responsibilityArchMappingId,
      branchNames: Array.isArray(data.branch) ? data.branch : [data.branch],
      departmentNames: Array.isArray(data.department)
        ? data.department
        : [data.department],
      designationNames: Array.isArray(data.designation)
        ? data.designation
        : [data.designation],
      responsiblityMasterID: data.responsibilityName,
      status: parseInt(data.status),
    };

    this.responsibilityService
      .updateResponsibilityArchMapping(payload)
      .subscribe({
        next: (response) => {
          this.notificationService.showSuccess(
            'Responsibility mapping updated successfully',
          );
          this.goBack();
        },
        error: (error) => {
          this.notificationService.showError(
            'Failed to update responsibility mapping',
          );
          console.error('Error updating responsibility mapping:', error);
        },
      });
  }

  goBack() {
    this.router.navigate(['responsibility/archResponsibilityMappingList']);
  }
}
