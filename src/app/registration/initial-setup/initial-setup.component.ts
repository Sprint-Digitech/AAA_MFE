import { Component } from '@angular/core';
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
    // Optional: doesn't block progress (isSetupComplete only ever depends on
    // the LAST step, "Process Salary", completing - never on this one) and
    // isn't counted in the progress bar/total below, since many companies
    // legitimately never configure PF/ESI/PT statutory details even while
    // fully live on payroll.
    { label: 'Setup Statuary Components', path: '', stepId: '', optional: true },
    { label: 'Add Employees', path: 'employee/employeesList', stepId: '' },
    { label: "Add Employee's CTC", path: 'employee/employeeCTC', stepId: '' },
    {
      label: "Add Employee's Attendance",
      path: 'employee/addEmployeeAttendanceBysheet',
      stepId: '',
    },
    { label: 'Process Salary', path: 'salary/salaryy', stepId: '' },
  ];

  // Tracks actual completion for each step
  stepCompletion: boolean[] = [false, false, false, false, false, false, false];

  // Excludes optional steps so the progress bar reads "6 of 6" (100%) once
  // everything that actually matters is done, instead of looking perpetually
  // stuck at less than 100% because of an optional step nobody is required
  // to complete.
  get totalSteps(): number {
    return this.steps.filter((s) => !s.optional).length;
  }

  constructor(private router: Router, private accountService: AccountService) { }

  ngOnInit() {
    const raw = sessionStorage.getItem('user');
    if (!raw || raw === 'null') {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    const user = JSON.parse(raw);
    this.user = user;
    const email = user.email;
    const tenantSchema = sessionStorage.getItem('tenantSchema') || user.tenantSchema || '';

    if (!email || !tenantSchema) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    // Fetch role and hierarchy data from HRMSAuthZ
    this.accountService.getEmployeeAuthDetail(email, tenantSchema).subscribe({
      next: (authDetail: any) => {
        // Resolve user roles from HRMSAuthZ
        const employeeRoles: any[] = authDetail?.employeeRoles || [];
        const allRoles: any[] = authDetail?.roles || [];
        const userRoleIds = employeeRoles.map((er: any) => er.roleID || er.RoleID);
        const userRoleObjs = allRoles.filter((r: any) =>
          userRoleIds.includes(r.roleID || r.RoleID)
        );

        this.isAdminOrHR = userRoleObjs.some((r: any) => {
          const rn = r.roleName || r.RoleName || '';
          return rn === 'Admin' || rn === 'HR' || rn === 'Human Resource';
        });

        this.userRole = userRoleObjs[0]?.roleName || userRoleObjs[0]?.RoleName || null;

        // Resolve IDs preferring session values, falling back to HRMSAuthZ
        this.companyId = user.companyId || authDetail?.companyId || '';
        this.branchId = user.companyBranchId || user.branchID || authDetail?.branchId || '';
        this.employeeId = authDetail?.employeeId || authDetail?.EmployeeId || '';

        if (this.isAdminOrHR) {
          this.employeeRoleLoginDtos = user.employeeRoleLoginDtos || null;
          this.loginData = { ...user, branchID: this.branchId };

          this.stepCompletion[0] = true;
          this.stepCompletion[1] = true;

          if (this.companyId)
            this.steps[0].path = `company/details/${this.companyId}`;
          if (this.branchId)
            this.steps[2].path = `company/branchDetails/${this.companyId}/${this.branchId}`;

          this.getBranchesOfCompany();
        } else {
          // Employee (non-Admin/HR) — redirect to ESS dashboard
          this.router.navigate(['/employeeSelfService/EssDashboard'], { replaceUrl: true });
        }
      },
      error: () => {
        // Fallback: cannot determine role, send to ESS dashboard
        this.router.navigate(['/employeeSelfService/EssDashboard'], { replaceUrl: true });
      }
    });
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

  get completedSteps() {
    return this.stepCompletion.filter((v, i) => v && !this.steps[i].optional).length;
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

    // Was: bail out entirely if step.stepId isn't known yet - which is always
    // true the FIRST time a step is ever completed for a tenant, since
    // stepId only ever comes from a prior GetSteps response. That meant a
    // step's first completion could never be saved, for any tenant. The
    // backend now upserts by (companyBranchId, stepName) when setupStepId is
    // empty, so it's safe to just send whatever we have (undefined is fine).
    const body = {
      setupStepId: step.stepId || undefined,
      companyBranchId: branchId,
      stepName: step.label,
      isCompleted: isDataSaved,
      updatedBy: this.employeeId || undefined,
    };
    this.accountService.post('api/InitialSetup/UpdateStep', body).subscribe({
      next: (res) => {
        console.log(`Step "${step.label}" saved successfully`, res);
        this.stepCompletion[stepIndex] = true;
        this.stepCompletion = [...this.stepCompletion];

        if (isDataSaved && stepIndex === this.steps.length - 1) {
          console.log('Last step completed, updating setup status...');
          this.loadStatus();
          return;
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
    // Was: bail out if initialSetupStatusID isn't known yet - which is always
    // true the first time a tenant's status is ever saved (it only ever comes
    // from a prior GetStatus response, which returns nothing for a company
    // that's never had a status row). The backend now upserts by
    // companyBranchId when this is empty, so it's safe to proceed regardless.
    const body = {
      initialSetupStatusID: this.initialSetupStatusID || undefined,
      companyBranchId: branchId,
      isSetupComplete: true,
      updatedBy: this.employeeId || undefined,
    };

    this.accountService.post('api/InitialSetup/UpdateStatus', body).subscribe({
      next: (res) => {
        console.log('Setup status updated successfully:', res);
        alert('Initial setup completed successfully!');
        const dest = this.isAdminOrHR ? '/salary/salaryDashboard' : '/employeeSelfService/dashboard';
        if (window !== window.parent) {
          window.parent.location.href = window.location.origin + dest;
        } else {
          this.router.navigate([dest], { replaceUrl: true });
        }
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
    if (branchId) {
      this.accountService
        .get(`api/InitialSetup/GetSteps?companyBranchId=${branchId}`)
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
    this.checkProcessSalary();
  }

  // "Process Salary" checked independently of the attendance check - any
  // branch, any month, has salary EVER been processed for this company at
  // all. Previously this only ran as a side effect chained inside
  // getEmployeeAttendance()'s success handler, so a gap/bug in attendance
  // data (or simply zero attendance records) meant Process Salary could
  // never be detected even when salary genuinely had been run.
  checkProcessSalary() {
    this.accountService.get('api/Salary/HasSalary').subscribe({
      next: (hasSalary: any) => {
        if (hasSalary) {
          this.markStepComplete(6);
          this.loadStep(6, true);
        }
      },
      error: (err) => {
        console.error('Error checking salary existence', err);
      },
    });
  }

  getBranchesOfCompany() {
    this.accountService.get('api/company-branch/GetCompanyBranch').subscribe({
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
    // Was 'api/Salary/EmployeeBasicDetailList' - that route doesn't exist on
    // any backend (the real endpoint is EmployeeBasicDetailList under
    // AttendenceSource on the Employee/ESS service), so this call 404'd
    // every time and "Add Employees" could never complete regardless of how
    // many employees the company actually had.
    this.accountService.get('api/AttendenceSource/EmployeeBasicDetailList').subscribe({
      next: (data: any[]) => {
        this.employees = data;
        console.log('Employees:', data);

        // Mark step 3 (Add Employees) as complete if any employee exists
        if (data && data.length > 0) {
          this.markStepComplete(3);
          this.loadStep(3, true);
        }
      },
      error: (err) => {
        console.error('Error fetching employees', err);
      },
    });
  }

  getEmployeeCtc() {
    this.accountService.get('api/Salary/HasEmployeeCtc').subscribe({
      next: (hasCtc: any) => {
        if (hasCtc) {
          this.markStepComplete(4);
          this.loadStep(4, true);
        }
      },
      error: (err) => {
        console.error('Error checking Employee CTC existence', err);
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

          // "Add Employee's Attendance" is a one-time onboarding milestone
          // ("has attendance ever been set up"), not an ongoing monthly
          // requirement - checking specifically for the CURRENT calendar
          // month meant a company that processed attendance every month for
          // the last year but hasn't yet done THIS month would incorrectly
          // show this step as incomplete forever between processing runs.
          const keysWithData = keys.filter(
            (k) => Array.isArray(data[k]) && data[k].length > 0
          );
          const hasAnyAttendance = keysWithData.length > 0;

          if (hasAnyAttendance) {
            this.markStepComplete(5);
            this.loadStep(5, true);
          } else {
            console.warn('No attendance data found.');
          }
          // Note: "Process Salary" (step 6) is checked independently via
          // checkProcessSalary() - not chained off attendance data anymore.
        },
        error: (err) => {
          console.error('Error fetching attendance', err);
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
        `api/company-branch/GetCompanyStatutory?companyBranchId=${this.branchId}`
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
            this.loadStep(stepIndex, true);
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
