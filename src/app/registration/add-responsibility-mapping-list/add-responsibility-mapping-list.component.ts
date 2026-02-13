import { ChangeDetectorRef, Component } from '@angular/core';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NotificationService } from '../../shared/services/notification.service';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { AccountService } from '../../shared/services/account.service';
import { UtilityService } from '../../shared/services/utility.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-responsibility-mapping-list',
  imports: [AddUpdateFormComponent,CommonModule],
  templateUrl: './add-responsibility-mapping-list.component.html',
  styleUrls: ['./add-responsibility-mapping-list.component.scss'],
})
export class AddResponsibilityMappingListComponent {
  addResponsibilityMappingFormLoaded: boolean = false;
  addResponsibilityMappingFormConfig!: FormConfig;
  responsibilityArchMappingOptions: any[] = [];
  employeeOptions: any[] = [];
  searchTerm: string = '';
  employees: any[] = [];
  showDropdown: boolean = false;
  filteredEmployeeDetails: any[] = [];
  selectedEmployee: any = null;
  userBranchId: string = '';
  employeeResponsibilityMappingId: string = '';
  isEditMode = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private responsibilityService: ResponsibilityService,
    private cdr: ChangeDetectorRef,
    private service: AccountService,
  ) {}
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.employeeResponsibilityMappingId = params['id'];
      }

      // Load all data first
      this.loadAllData();
    });
  }
  loadAllData() {
    forkJoin({
      employees: this.service.get('api/Employee/EmployeeBasicDetailList'),
      responsibilityArchMappings:
        this.responsibilityService.getResponsibilityArchMappingList(), // Existing service use kiya
    }).subscribe({
      next: (results) => {
        console.log('Raw Employees:', results.employees); // Debug log
        console.log('User Branch ID:', this.userBranchId); // Debug: Check branch ID

        // Process employees - FIX: Remove branch filter or fix condition
        // Option 1: Remove filter completely (show all employees)
        this.employees = results.employees || [];

        // Option 2: Fix the filter condition (use only if userBranchId is valid)

        console.log('Filtered Employees:', this.employees); // Debug log

        this.employeeOptions = this.employees.map((employee: any) => {
          const fullName = [
            employee.employeeFirstName,
            employee.employeeMiddleName,
            employee.employeeLastName,
          ]
            .filter((name) => name)
            .join(' ');

          const label = fullName
            ? `${employee.employeeCode} - ${fullName}`
            : employee.employeeCode;

          return {
            value: employee.employeeId, // Use employeeId as value
            code: employee.employeeCode,
            name: fullName,
            label,
            email: employee.email,
          };
        });

        // Sort employee options
        this.employeeOptions.sort((a, b) => {
          const codeA = (a.code || '').toLowerCase();
          const codeB = (b.code || '').toLowerCase();
          if (codeA !== codeB) {
            return codeA.localeCompare(codeB);
          }
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        // Process responsibility arch mappings
        this.responsibilityArchMappingOptions =
          results.responsibilityArchMappings
            .filter((item: any) => item.status === 1)
            .map((item: any) => ({
              value: item.responsibilityArchMappingID,
              label: `${item.branchNames?.join(', ')} - ${item.departmentNames?.join(', ')} - ${item.designationNames?.join(', ')}`,
            }));

        console.log('Employee Options:', this.employeeOptions);
        console.log(
          'Responsibility Arch Mapping Options:',
          this.responsibilityArchMappingOptions,
        );

        // Initialize form after data is loaded
        if (this.isEditMode) {
          this.fetchEmployeeResponsibilityMappingById(
            this.employeeResponsibilityMappingId,
          );
        } else {
          this.initializeFormConfig();
          this.addResponsibilityMappingFormLoaded = true;
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.showError('Failed to load form data');
      },
    });
  }
  fetchEmployeeResponsibilityMappingById(id: string) {
    this.responsibilityService
      .getEmployeeResponsibilityMappingById(id)
      .subscribe({
        next: (response: any) => {
          // Find employee by email
          const employee = this.employees.find(
            (emp: any) => emp.email === response.email,
          );

          const initialValues = {
            employeeName: employee?.employeeId || '',
            responsibilityName: response[0].responsiblityArchMappingId || '',
            status: response[0].status,
          };

          if (employee) {
            this.selectedEmployee = employee;
          }

          this.initializeFormConfig(initialValues);
          this.addResponsibilityMappingFormLoaded = true;
        },
        error: (error) => {
          this.notificationService.showError(
            'Failed to fetch employee responsibility mapping details',
          );
          console.error(
            'Error fetching employee responsibility mapping:',
            error,
          );
          this.goBack();
        },
      });
  }
  initializeFormConfig(initialValues?: any) {
    this.addResponsibilityMappingFormConfig = {
      formTitle: this.isEditMode
        ? 'Update Employee Responsibility Mapping'
        : 'Add Employee Responsibility Mapping',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'employeeName',
              label: 'Employee Name',
              type: 'select',
              options: this.employeeOptions,
              colSpan: 1,
              value: initialValues?.employeeName || '',
              onChange: (value: any) => this.handleEmployeeSelectChange(value),
              validations: [
                { type: 'required', message: 'Display Name is required' },
              ],
            },
            {
              name: 'responsibilityName',
              label: 'Responsibility Name',
              type: 'select',
              options: this.responsibilityArchMappingOptions,
              colSpan: 1,
              value: initialValues?.responsibilityName || '',
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

  handleEmployeeSelectChange(selection: any) {
    const employeeId =
      typeof selection === 'string' ? selection : selection?.value;

    if (!employeeId) {
      return;
    }

    const employee = this.employees?.find(
      (emp: any) => emp.employeeId === employeeId,
    );

    if (employee) {
      this.selectedEmployee = employee;
      console.log('Selected Employee:', this.selectedEmployee);
    }
  }

  onSubmit(data: any) {
    if (this.isEditMode) {
      this.updateEmployeeResponsibilityMapping(data);
    } else {
      this.createEmployeeResponsibilityMapping(data);
    }
  }

  createEmployeeResponsibilityMapping(data: any) {
    if (!this.selectedEmployee) {
      this.notificationService.showError('Please select an employee');
      return;
    }

    const payload = {
      employeeResponsblityMappingID: UtilityService.generateGuid(),
      responsiblityArchMappingId: data.responsibilityName,
      email: this.selectedEmployee.email,
    };

    console.log('Create Payload:', payload);

    this.responsibilityService
      .createEmployeeResponsibilityMapping(payload)
      .subscribe({
        next: (response) => {
          this.notificationService.showSuccess(
            'Employee responsibility mapping created successfully',
          );
          this.goBack();
        },
        error: (error) => {
          this.notificationService.showError(
            'Failed to create employee responsibility mapping',
          );
          console.error(
            'Error creating employee responsibility mapping:',
            error,
          );
        },
      });
  }

  updateEmployeeResponsibilityMapping(data: any) {
    if (!this.selectedEmployee) {
      this.notificationService.showError('Please select an employee');
      return;
    }

    const payload = {
      employeeResponsblityMappingID: this.employeeResponsibilityMappingId,
      responsiblityArchMappingId: data.responsibilityName,
      email: this.selectedEmployee.email,
      status: parseInt(data.status),
    };

    console.log('Update Payload:', payload);

    this.responsibilityService
      .updateEmployeeResponsibilityMapping(payload)
      .subscribe({
        next: (response) => {
          this.notificationService.showSuccess(
            'Employee responsibility mapping updated successfully',
          );
          this.goBack();
        },
        error: (error) => {
          this.notificationService.showError(
            'Failed to update employee responsibility mapping',
          );
          console.error(
            'Error updating employee responsibility mapping:',
            error,
          );
        },
      });
  }
  goBack() {
    this.router.navigate(['responsibility/mappingResponsibilityList']);
  }
}
