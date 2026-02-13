import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../../shared/services/account.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-initial-setup',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatIconModule],
  templateUrl: './initial-setup.component.html',
  styleUrl: './initial-setup.component.scss',
})
export class InitialSetupComponent {
  username = '';
  companyId: any;
  branches: any;
  branchId: any;
  initialSetupStatusID: string = '';
  employeeId: string = '';
  employees: any;
  monthData: any;
  employeeCtc: any;
  salaryData: any;
  branchStatutoryList: any;
  id: any;
  month: any;
  year: any;
  currentStepIndex = 0;
  userRole: string | null = null;
  employeeRoleLoginDtos: any;
  loginData: any;

  // For Employee/Manager dashboard view
  isAdminOrHR: boolean = false;
  user: any = null;
  userName: string = '';
  userEmail: string = '';
  employeeCode: string = '';
  designation: string = '';
  role: string = '';
  department: string = '';
  companyName: string = '';
  branchName: string = '';
  employeePhoto: string = '';
  steps = [
    { label: 'Add Organization Details', path: '', stepId: '' },
    { label: 'Setup Salary Components', path: 'payRoll/payHead', stepId: '' },
    { label: 'Setup Statuary Components', path: '', stepId: '' },
    { label: 'Add Employees', path: 'employee/employeesList', stepId: '' },
    { label: "Add Employee's CTC", path: 'employee/employeeCTC', stepId: '' },
    {
      label: "Add Employee's Attendance",
      path: 'employee/addEmployeeAttendanceBysheet',
      stepId: '',
    },
    { label: 'Process Salary', path: 'salary/salaryy', stepId: '' },
  ];
  totalSteps = this.steps.length;

  // Tracks actual completion for each step
  stepCompletion: boolean[] = [false, false, false, false, false, false, false];

  constructor(private router: Router, private accountService: AccountService) {}

  ngOnInit() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    this.user = user;

    // Check if user has Admin or HR role
    const userRoles = user.employeeRoleLoginDtos || [];
    this.isAdminOrHR = userRoles.some((role: any) => {
      const roleName = role?.roleName || '';
      return (
        roleName === 'Admin' ||
        roleName === 'HR' ||
        roleName === 'Human Resource'
      );
    });

    // If user is Admin or HR, show setup page
    if (this.isAdminOrHR) {
      const email = user.email;
      this.companyId = user.companyId || '';
      this.branchId = user.companyBranchId || user.branchID || '';
      this.userRole = user.userRole || user.roleName || null;
      this.employeeRoleLoginDtos =
        user.employeeRoleLoginDtos || user.employeeRoleLoginDtos?.[0] || null;
      this.loginData = user;

      this.stepCompletion[0] = true;
      this.stepCompletion[1] = true;

      if (this.companyId)
        this.steps[0].path = `company/details/${this.companyId}`;
      if (this.branchId)
        this.steps[2].path = `company/branchDetails/${this.companyId}/${this.branchId}`;

      // Step 1: fetch employeeId
      this.getEmployeeIdByEmail(email);
    } else {
      // For Employee/Manager, show dashboard view
      this.initializeEmployeeDashboard(user);
    }
  }

  initializeEmployeeDashboard(user: any) {
    this.userName =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.name ||
      'User';
    this.userEmail = user.email || '';
    this.employeeCode = user.employeeCode || '';
    this.designation = user.designationName || user.designation || '';
    this.role =
      user.employeeRoleLoginDtos?.[0]?.roleName ||
      user.employeeRoleLoginDtos?.[0]?.roleDisplayName ||
      user.roleName ||
      '';
    this.department = user.departmentName || user.department || '';
    this.companyName = user.companyName || user.company?.companyName || '';
    this.branchName = user.branchName || user.branch?.branchName || '';
    this.employeePhoto =
      user.employeePhoto ||
      user.profilePicture ||
      'assets/img/user_profile_.jpg';
  }
  markStepComplete(stepIndex: number) {
    this.stepCompletion[stepIndex] = true;
    // Trigger change detection
    this.stepCompletion = [...this.stepCompletion];
  }

  // Helper method to get current month in format "MonthName-YYYY" (e.g., "January-2025")
  private getCurrentMonthKey(): string {
    const now = new Date();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthName = monthNames[now.getMonth()];
    const year = now.getFullYear();
    return `${monthName}-${year}`;
  }
  get completedSteps() {
    // return this.currentStepIndex;
    return this.stepCompletion.filter((v) => v).length;
  }

  get progress() {
    return (this.completedSteps / this.totalSteps) * 100;
  }

  goToStep(index: number) {
    this.currentStepIndex = index;

    // if (!this.stepCompletion[this.currentStepIndex]) {
    //   this.loadStep(index);
    // }

    const step = this.steps[index];
    this.router.navigate([step.path]);
  }
  isCurrentStepCompleted() {
    return this.stepCompletion[this.currentStepIndex];
  }
  getNextIncompleteStep(): number {
    return this.stepCompletion.findIndex((v) => !v);
  }

  loadStep(stepIndex: number, isDataSaved: boolean = false) {
    if (!this.branches || this.branches.length === 0) {
      console.warn('No branches loaded yet.');
      return;
    }
    const branchId = this.branches[0].id;
    const step = this.steps[stepIndex];

    if (!step.stepId) {
      console.error('No stepId found for step:', step.label);
      return;
    }
    const body = {
      setupStepId: step.stepId,
      companyBranchId: branchId,
      stepName: step.label,
      isCompleted: isDataSaved,
      updatedBy: this.employeeId || null,
    };
    this.accountService.post('api/InitialSetup/step', body).subscribe({
      next: (res) => {
        console.log(`Step "${step.label}" saved successfully`, res);
        this.stepCompletion[stepIndex] = true;
        this.stepCompletion = [...this.stepCompletion];
        this.loadInitialSteps(branchId); // refresh steps from API

        if (isDataSaved && stepIndex === this.steps.length - 1) {
          console.log('Last step completed, updating setup status...');
          this.loadStatus();
          return;
        }
        const nextStepIndex = this.getNextIncompleteStep();
        if (nextStepIndex !== -1) {
          this.goToStep(nextStepIndex);
        }
        // if (stepIndex === this.steps.length - 1) {
        //   this.loadStatus();
        // }
      },
      error: (err) => {
        console.error('Error saving step', err);
      },
    });
  }

  loadStatus() {
    if (!this.branches || this.branches.length === 0) return;

    const branchId = this.branches[0].id;
    if (!this.initialSetupStatusID) {
      console.error('No initialSetupStatusID found from DB.');
      return;
    }

    const body = {
      initialSetupStatusID: this.initialSetupStatusID,
      companyBranchId: branchId,
      isSetupComplete: true,
      updatedBy: this.employeeId,
    };

    this.accountService.post('api/InitialSetup/status', body).subscribe({
      next: (res) => {
        console.log('Setup status updated successfully:', res);
      },
      error: (err) => {
        console.error('Error saving Status', err);
      },
    });
  }

  loadInitialSteps(branchId: string) {
    if (!branchId) {
      console.warn('BranchId not found.');
      // Still check data even if branchId is missing
      this.checkDataAndUpdateCompletion();
      return;
    }
    if (
      this.employeeRoleLoginDtos?.roleName !== 'Admin' &&
      this.loginData?.branchID
    ) {
      this.accountService
        .get(`api/InitialSetup/Initialsteps?CompanyBranchId=${branchId}`)
        .subscribe({
          next: (res: any[]) => {
            console.log('Initial steps list from API:', res);

            this.stepCompletion = this.steps.map(() => false);

            res.forEach((apiStep) => {
              const index = this.steps.findIndex(
                (s) => s.label === apiStep.stepName
              );
              if (index >= 2) {
                this.stepCompletion[index] = apiStep.isCompleted;
                this.steps[index].stepId = apiStep.setupStepId;
              }
            });
            this.stepCompletion[0] = true;
            this.stepCompletion[1] = true;

            if (res.length > 0 && res[0].initialSetupStatusID) {
              this.initialSetupStatusID = res[0].initialSetupStatusID;
            }

            // After loading stepIds, check data and update completion status
            this.checkDataAndUpdateCompletion();
          },

          error: (err) => {
            console.error('Error loading initial steps', err);
            // Even if API fails, still check data for UI purposes
            this.checkDataAndUpdateCompletion();
          },
        });
    } else {
      // For Admin users or if loadInitialSteps doesn't run, still check data
      this.checkDataAndUpdateCompletion();
    }
  }

  // Helper method to check all data conditions and update step completion
  checkDataAndUpdateCompletion() {
    // Check all data conditions and update completion status
    // These methods will update stepCompletion based on actual data availability
    this.getEmployees();
    this.getEmployeeCtc();
    this.getEmployeeAttendance();
    this.getStatutory();
  }

  getEmployeeIdByEmail(email: string) {
    this.accountService
      .logindetail(`api/Account/GetEmployeeLoginDetail?email=${email}`)
      .subscribe({
        next: (res: any) => {
          if (res && res.id) {
            this.employeeId = res.id; // store the ID to use in updatedBy
            console.log('Employee ID  (Guid) fetched:', this.employeeId);
            if (this.userRole === 'Admin') {
              this.getBranchesOfCompany();
            } else {
              console.log('Not an Admin — skipping Initial Setup API call');
            }
          } else {
            console.error('No ID found in employee response', res);
          }
        },
        error: (err) => {
          console.error('Error fetching employee ID', err);
        },
      });
  }
  getBranchesOfCompany() {
    this.accountService.get('api/CompanyBranch/CompanyBranchList').subscribe({
      next: (data) => {
        this.branches = data || [];
        console.log('Branches loaded:', this.branches);
        if (this.branches.length > 0) {
          this.branchId = this.branches[0].id;
          console.log('BranchId set to:', this.branchId);
          // Load initial steps first, which will call checkDataAndUpdateCompletion
          // after stepIds are loaded (or immediately for Admin users)
          this.loadInitialSteps(this.branchId);
        }
      },
      error: (err) => {
        console.error('Failed to fetch branches', err);
      },
    });
  }
  getEmployees() {
    this.accountService.get('api/Employee/EmployeeBasicDetailList').subscribe({
      next: (data: any[]) => {
        this.employees = data;
        console.log('Employees:', data);

        // Mark step 3 (Add Employees) as complete if any employee exists
        if (data && data.length > 0) {
          this.markStepComplete(3);
          // Also save to API if stepId is available
          if (this.steps[3].stepId) {
            this.loadStep(3, true);
          }
        }
      },
      error: (err) => {
        console.error('Error fetching employees', err);
      },
    });
  }

  getEmployeeCtc() {
    this.accountService.get('api/PayRoll/GetEmployeeCtcList').subscribe({
      next: (data: any[]) => {
        this.employeeCtc = data;
        console.log('Employee CTC List:', data);

        // Mark step 4 (Add Employee's CTC) as complete if any CTC exists
        if (data && data.length > 0) {
          this.markStepComplete(4);
          // Also save to API if stepId is available
          if (this.steps[4].stepId) {
            this.loadStep(4, true);
          }
        }
      },
      error: (err) => {
        console.error('Error fetching Employee CTC List', err);
      },
    });
  }

  getEmployeeAttendance() {
    this.accountService
      .get('api/EmployeeAttendance/GetMonthlyEmployeeAttendance')
      .subscribe({
        next: (data: any) => {
          this.monthData = data;
          console.log('Attendance Data:', data);
          const keys = Object.keys(data);
          console.log('Available months:', keys);

          // Check if attendance exists for the current month
          const currentMonthKey = this.getCurrentMonthKey();
          const hasCurrentMonthAttendance =
            keys.includes(currentMonthKey) &&
            data[currentMonthKey] &&
            Array.isArray(data[currentMonthKey]) &&
            data[currentMonthKey].length > 0;

          if (hasCurrentMonthAttendance) {
            // Mark step 5 (Add Employee's Attendance) as complete if current month attendance exists
            this.markStepComplete(5);
            // Also save to API if stepId is available
            if (this.steps[5].stepId) {
              this.loadStep(5, true);
            }

            // Extract month and year for salary fetch
            const [monthName, yearValue] = currentMonthKey.split('-');
            this.month = monthName;
            this.year = yearValue;
            console.log(
              'Current Month Attendance Found:',
              this.month,
              'Year:',
              this.year
            );

            // Fetch salary for that month-year
            if (this.branchId) {
              this.getEmployeesSalary(this.branchId, this.month, this.year);
            }
          } else {
            // Still try to get first available month for salary fetch if needed
            if (keys.length > 0) {
              const firstKey = keys[0]; // e.g. "January-2025"
              const [monthName, yearValue] = firstKey.split('-');
              this.month = monthName;
              this.year = yearValue;
              console.log('Extracted Month:', this.month, 'Year:', this.year);

              if (this.branchId) {
                this.getEmployeesSalary(this.branchId, this.month, this.year);
              }
            } else {
              console.warn('No attendance data found.');
            }
          }
        },
        error: (err) => {
          console.error('Error fetching attendance', err);
        },
      });
  }

  getEmployeesSalary(branchId: string, month: string, year: string) {
    const apiUrl = `api/Salary/SalaryList?branchId=${branchId}&month=${month}&year=${year}`;
    this.accountService.get(apiUrl).subscribe({
      next: (data: any[]) => {
        this.salaryData = data;
        console.log('Salary Data:', data);

        if (data && data.length > 0) {
          this.loadStep(6, true);
        }
      },
      error: (err) => {
        console.error('Error fetching salary data', err);
      },
    });
  }
  getStatutory() {
    if (!this.branchId) {
      console.warn('BranchId not available for statutory check');
      return;
    }

    // Call the same API used in branch-details component
    this.accountService
      .get(
        `api/CompanyStatutoryIdentity/CompanyStatutoryListByCompanyBranchId?CompanyBranchId=${this.branchId}`
      )
      .subscribe({
        next: (data: any) => {
          this.branchStatutoryList = data;
          console.log('Statutory API response:', data);
          console.log('BranchId used:', this.branchId);
          console.log('Is array:', Array.isArray(data));
          console.log(
            'Data length:',
            Array.isArray(data) ? data.length : 'N/A'
          );

          // Check if statutory data exists - same logic as branch-details component
          // If API returns an array with items, statutory details exist
          const hasStatutoryData =
            data && Array.isArray(data) && data.length > 0;

          console.log('Has statutory data:', hasStatutoryData);

          // Mark step 2 (Setup Statuary Components - index 2, which is step 3 in 1-based) as complete if statutory details exist
          if (hasStatutoryData) {
            const stepIndex = 2; // Step 3 (1-based) = Index 2 (0-based): Setup Statuary Components
            console.log('Step index for statutory:', stepIndex);
            console.log('Step label:', this.steps[stepIndex]?.label);
            this.markStepComplete(stepIndex);
            console.log(
              'Marked step 2 (Setup Statuary Components) as complete based on statutory data'
            );
            // Also save to API if stepId is available
            if (this.steps[stepIndex]?.stepId) {
              this.loadStep(stepIndex, true);
            }
          } else {
            console.log(
              'No statutory data found - array is empty or undefined'
            );
          }
        },
        error: (err) => {
          console.error('Error fetching statutory data', err);
          console.error('BranchId used:', this.branchId);
        },
      });
  }
}
