import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
import {
  HrmsAuthzService,
  HrmsRole,
  HrmsGroupDto,
  HrmsCompanyDto,
  HrmsBranchDto
} from '../../shared/services/hrms-authz.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';
import { EnvironmentUrlService } from '../../shared/services/environment-url.service';
import { GlobalSearchService } from '../../shared/services/global-search.service';

interface EmployeeWithRoles {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  email: string;
  departmentName: string;
  designationName: string;
  branchName: string;
  roles: string[];
  lastEmailSentAt?: string;
}

@Component({
  standalone: true,
  selector: 'app-user-access-management',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatChipsModule,
    NemoReusableTblComponent
  ],
  templateUrl: './user-access-management.component.html',
  styleUrls: ['./user-access-management.component.scss']
})
export class UserAccessManagementComponent implements OnInit, OnDestroy {

  private searchTerm = '';
  private unsubscribeSearch: (() => void) | null = null;

  // ── Employee roles table ───────────────────────────────────────────────────
  empDataArray: any[] = [];
  empOriginalData: any[] = [];
  noRolesDataArray: any[] = [];
  noRolesOriginalData: any[] = [];
  availableRoles: string[] = [];
  selectedRows: any[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Inline filter
  filterBranch = '';
  filterDept = '';
  filterDesig = '';
  branchOptions: string[] = [];
  deptOptions: string[] = [];
  designOptions: string[] = [];

  // NemoReusableTbl columns
  empColumns = [
    { field: 'srNo', header: '#' },
    { field: 'branchName', header: 'Branch' },
    { field: 'employeeCode', header: 'Emp Code' },
    { field: 'employeeName', header: 'Emp Name' },
    { field: 'email', header: 'Email' },
    { field: 'departmentName', header: 'Department' },
    { field: 'designationName', header: 'Designation' },
    { field: 'lastEmailSentDisplay', header: 'Last Email Sent' },
    { field: 'rolesDisplay', header: 'Roles' }
  ];

  noRolesColumns = [
    { field: 'srNo', header: '#' },
    { field: 'branchName', header: 'Branch' },
    { field: 'employeeCode', header: 'Emp Code' },
    { field: 'employeeName', header: 'Emp Name' },
    { field: 'email', header: 'Email' },
    { field: 'departmentName', header: 'Department' },
    { field: 'designationName', header: 'Designation' }
  ];

  // Role editor modal
  showRoleModal = false;
  editingEmployee: any = null;
  editingRoles: string[] = [];
  isSavingRoles = false;

  // Add-email step (shown first when the employee has no email on file)
  needsEmail = false;
  newEmployeeEmail = '';
  isSavingEmail = false;

  // Set Password modal
  showSetPasswordModal = false;
  setPasswordEmployee: any = null;
  setPasswordValue = '';
  setPasswordConfirm = '';
  setPasswordShowNew = false;
  setPasswordShowConfirm = false;
  isSettingPassword = false;

  // ── HRMSAuthZ "Assign Role" modal ──────────────────────────────────────────
  showModal = false;
  isSaving = false;

  form = new FormGroup({
    hrmsRoleId: new FormControl('', Validators.required),
    hrmsGroupId: new FormControl(''),
    hrmsCompanyId: new FormControl(''),
    hrmsBranchId: new FormControl(''),
    departmentIds: new FormControl(''),
    departmentNames: new FormControl('')
  });

  // ── Modal employee selection ───────────────────────────────────────────────
  empModalSearch = '';
  selectedModalEmployees: any[] = [];

  get allModalEmployees(): any[] {
    return [...this.empOriginalData, ...this.noRolesOriginalData];
  }

  get filteredModalEmployees(): any[] {
    const t = this.empModalSearch.toLowerCase().trim();
    if (!t) return this.allModalEmployees;
    return this.allModalEmployees.filter(e =>
      (e.employeeName || '').toLowerCase().includes(t) ||
      (e.employeeCode || '').toLowerCase().includes(t) ||
      (e.email || '').toLowerCase().includes(t)
    );
  }

  get allModalEmpSelected(): boolean {
    const list = this.filteredModalEmployees;
    return list.length > 0 && list.every(e => this.isModalEmpSelected(e));
  }

  isModalEmpSelected(emp: any): boolean {
    return this.selectedModalEmployees.some(e => e.employeeId === emp.employeeId);
  }

  toggleModalEmployee(emp: any): void {
    const idx = this.selectedModalEmployees.findIndex(e => e.employeeId === emp.employeeId);
    if (idx >= 0) this.selectedModalEmployees.splice(idx, 1);
    else this.selectedModalEmployees.push(emp);
  }

  toggleSelectAllModalEmp(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const list = this.filteredModalEmployees;
      list.forEach(e => { if (!this.isModalEmpSelected(e)) this.selectedModalEmployees.push(e); });
    } else {
      const ids = new Set(this.filteredModalEmployees.map(e => e.employeeId));
      this.selectedModalEmployees = this.selectedModalEmployees.filter(e => !ids.has(e.employeeId));
    }
  }

  // ── Reference data ────────────────────────────────────────────────────────
  roles: HrmsRole[] = [];
  hierarchy: HrmsGroupDto[] = [];
  departments: any[] = [];

  get availableCompanies(): HrmsCompanyDto[] {
    const gid = this.form.get('hrmsGroupId')?.value;
    if (!gid) return [];
    return this.hierarchy.find(g => g.groupId === gid)?.companies ?? [];
  }

  get availableBranches(): HrmsBranchDto[] {
    const cid = this.form.get('hrmsCompanyId')?.value;
    if (!cid) return [];
    return this.availableCompanies.find(c => c.companyId === cid)?.branches ?? [];
  }

  selectedDeptIds: string[] = [];
  selectedDeptNames: string[] = [];

  constructor(
    private authzSvc: HrmsAuthzService,
    private notif: NotificationService,
    private accountSvc: AccountService,
    private envUrl: EnvironmentUrlService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private globalSearch: GlobalSearchService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadEmployeesWithRoles();
    this.loadAvailableRoles();
    this.unsubscribeSearch = this.globalSearch.registerConsumer(term => {
      this.searchTerm = (term ?? '').toLowerCase().trim();
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeSearch?.();
  }

  // ── Reference data ─────────────────────────────────────────────────────────
  loadReferenceData(): void {
    const tenantSchema = sessionStorage.getItem('tenantSchema') ?? 'dbo';
    this.authzSvc.getRoles().subscribe({ next: r => this.roles = r, error: () => {} });
    this.authzSvc.getHierarchy(tenantSchema).subscribe({ next: h => this.hierarchy = h, error: () => {} });
    this.accountSvc.get('api/HrmsAuthZ/departments').subscribe({
      next: (d: any) => this.departments = Array.isArray(d) ? d : [],
      error: () => {}
    });
  }

  // ── Employee roles ─────────────────────────────────────────────────────────
  loadAvailableRoles(): void {
    this.http.get<any[]>(`${this.envUrl.essUrlAddress}/api/EmployeeReport/GetRoles`).subscribe({
      next: (roles) => {
        this.availableRoles = (roles || [])
          .map((r: any) => typeof r === 'string' ? r : (r.roleName || r.RoleName || r.name || r.Name || ''))
          .filter((r: string) => !!r);
        this.cdr.detectChanges();
      },
      error: () => { this.availableRoles = ['Employee', 'Manager', 'Admin', 'HR']; }
    });
  }

  loadEmployeesWithRoles(): void {
    this.http.get<EmployeeWithRoles[]>(`${this.envUrl.essUrlAddress}/api/EmployeeReport/GetEmployeesWithRoles`).subscribe({
      next: (response) => {
        const all = response || [];
        const withRoles = all.filter(e => e.roles && e.roles.length > 0);
        const withoutRoles = all.filter(e => !e.roles || e.roles.length === 0);

        this.empOriginalData = withRoles.map((e, i) => this.mapEmployeeRow(e, i));
        this.noRolesOriginalData = withoutRoles.map((e, i) => this.mapEmployeeRow(e, i));
        this.empDataArray = [...this.empOriginalData];
        this.noRolesDataArray = [...this.noRolesOriginalData];
        this.updateFilterOptions();
        this.cdr.detectChanges();
      },
      error: () => this.notif.showError('Failed to load employee roles data.')
    });
  }

  private mapEmployeeRow(emp: EmployeeWithRoles, index: number): any {
    return {
      srNo: (index + 1).toString().padStart(2, '0'),
      branchName: emp.branchName || 'N/A',
      employeeCode: emp.employeeCode || 'N/A',
      employeeName: emp.employeeName || 'N/A',
      email: emp.email || 'N/A',
      departmentName: emp.departmentName || 'N/A',
      designationName: emp.designationName || 'N/A',
      roles: emp.roles ? [...emp.roles] : [],
      rolesDisplay: emp.roles?.length ? emp.roles.join(', ') : '—',
      lastEmailSentDisplay: this.formatDate(emp.lastEmailSentAt || null),
      employeeId: emp.employeeId,
      lastEmailSentAt: emp.lastEmailSentAt || null
    };
  }

  updateFilterOptions(): void {
    const all = [...this.empOriginalData, ...this.noRolesOriginalData];
    this.branchOptions = [...new Set(all.map(r => r.branchName))].filter(v => v !== 'N/A').sort();
    this.deptOptions   = [...new Set(all.map(r => r.departmentName))].filter(v => v !== 'N/A').sort();
    this.designOptions = [...new Set(all.map(r => r.designationName))].filter(v => v !== 'N/A').sort();
    this.cdr.detectChanges();
  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const b = this.filterBranch;
    const d = this.filterDept;
    const g = this.filterDesig;
    const term = this.searchTerm;
    const matches = (item: any): boolean => {
      if (b && item.branchName !== b) return false;
      if (d && item.departmentName !== d) return false;
      if (g && item.designationName !== g) return false;
      if (term) {
        const hay = [
          item.employeeName, item.employeeCode, item.email,
          item.branchName, item.departmentName, item.designationName,
          ...(item.roles || [])
        ].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    };
    this.empDataArray = this.empOriginalData.filter(matches);
    this.noRolesDataArray = this.noRolesOriginalData.filter(matches);
    this.selectedRows = [];
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.empDataArray.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.empDataArray.length / this.pageSize));
  }

  get visiblePages(): number[] {
    const cur = this.currentPage;
    const total = this.totalPages;
    const range: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) range.push(i);
    return range;
  }

  changePage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  onPageSizeChange(): void { this.currentPage = 1; }

  trackByEmpId(_index: number, row: any): string { return row.employeeId; }

  // ── Row selection ──────────────────────────────────────────────────────────
  get allSelected(): boolean {
    return this.paginatedData.length > 0 &&
      this.paginatedData.every(r => this.isSelected(r));
  }

  toggleSelectAll(event: Event): void {
    if ((event.target as HTMLInputElement).checked) {
      this.paginatedData.forEach(r => { if (!this.isSelected(r)) this.selectedRows.push(r); });
    } else {
      const ids = new Set(this.paginatedData.map(r => r.employeeId));
      this.selectedRows = this.selectedRows.filter(r => !ids.has(r.employeeId));
    }
    this.cdr.detectChanges();
  }

  toggleRow(row: any): void {
    const idx = this.selectedRows.findIndex(r => r.employeeId === row.employeeId);
    if (idx >= 0) this.selectedRows.splice(idx, 1);
    else this.selectedRows.push(row);
    this.cdr.detectChanges();
  }

  isSelected(row: any): boolean {
    return this.selectedRows.some(r => r.employeeId === row.employeeId);
  }

  // ── Bulk Reset Password ────────────────────────────────────────────────────
  bulkResetPassword(): void {
    if (!this.selectedRows.length) {
      this.notif.showError('Please select at least one employee.');
      return;
    }
    const emails = this.selectedRows.map(r => r.email).filter(e => e && e !== 'N/A');
    if (!emails.length) {
      this.notif.showError('Selected employees have no valid email addresses.');
      return;
    }
    this.http.post<{ message: string }>(`${this.accountSvc.environment.urlAddress}/api/Account/BulkResetPassword`, emails).subscribe({
      next: (res) => {
        const now = new Date().toISOString();
        emails.forEach(email => {
          const row = this.empOriginalData.find(r => r.email === email);
          if (row) { row.lastEmailSentAt = now; row.lastEmailSentDisplay = this.formatDate(now); }
        });
        this.selectedRows = [];
        this.notif.showSuccess(res?.message || `Password reset emails sent to ${emails.length} employee(s).`);
      },
      error: () => this.notif.showError('Failed to reset passwords.')
    });
  }

  // ── Role editor ────────────────────────────────────────────────────────────
  openRoleEditor(emp: any): void {
    this.editingEmployee = emp;
    this.editingRoles = [...(emp.roles || [])];
    this.needsEmail = !emp.email || emp.email === 'N/A';
    this.newEmployeeEmail = '';
    this.showRoleModal = true;
  }

  closeRoleEditor(): void {
    this.showRoleModal = false;
    this.editingEmployee = null;
    this.editingRoles = [];
    this.needsEmail = false;
    this.newEmployeeEmail = '';
  }

  saveEmployeeEmail(): void {
    if (!this.editingEmployee) return;
    const email = this.newEmployeeEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      this.notif.showError('Please enter a valid email address.');
      return;
    }
    this.isSavingEmail = true;
    this.http.post<{ message: string }>(
      `${this.envUrl.essUrlAddress}/api/EmployeeReport/AddEmployeeEmail`,
      { employeeId: this.editingEmployee.employeeId, email }
    ).subscribe({
      next: () => {
        this.editingEmployee.email = email;
        const row = this.noRolesOriginalData.find(r => r.employeeId === this.editingEmployee.employeeId);
        if (row) row.email = email;
        const row2 = this.noRolesDataArray.find(r => r.employeeId === this.editingEmployee.employeeId);
        if (row2) row2.email = email;
        this.needsEmail = false;
        this.isSavingEmail = false;
        this.notif.showSuccess('Email added. You can now assign roles.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notif.showError(err?.error?.message || 'Failed to add email.');
        this.isSavingEmail = false;
      }
    });
  }

  hasRole(role: string): boolean { return this.editingRoles.includes(role); }

  toggleRole(role: string): void {
    const idx = this.editingRoles.indexOf(role);
    if (idx >= 0) this.editingRoles.splice(idx, 1);
    else this.editingRoles.push(role);
  }

  saveRoles(): void {
    if (!this.editingEmployee) return;
    const email = this.editingEmployee.email;
    if (!email || email === 'N/A') {
      this.notif.showError('Cannot update roles: employee has no email.');
      return;
    }
    this.isSavingRoles = true;
    const hadRoles = (this.editingEmployee.roles || []).length > 0;
    const hasRolesNow = this.editingRoles.length > 0;
    const newRoles = [...this.editingRoles];

    this.http.post<{ message: string }>(
      `${this.envUrl.essUrlAddress}/api/EmployeeReport/UpdateEmployeeRoles`,
      { email, employeeId: this.editingEmployee.employeeId, roles: newRoles }
    ).subscribe({
      next: () => {
        const now = new Date().toISOString();
        const rolesDisplay = newRoles.length ? newRoles.join(', ') : '—';
        const updatedRow = { ...this.editingEmployee, roles: [...newRoles], rolesDisplay, lastEmailSentAt: now, lastEmailSentDisplay: this.formatDate(now) };

        if (!hadRoles && hasRolesNow) {
          this.noRolesOriginalData = this.noRolesOriginalData.filter(r => r.employeeId !== updatedRow.employeeId);
          this.noRolesDataArray = this.noRolesDataArray.filter(r => r.employeeId !== updatedRow.employeeId);
          this.empOriginalData = [...this.empOriginalData, updatedRow];
          this.empDataArray = [...this.empDataArray, updatedRow];
        } else if (hadRoles && !hasRolesNow) {
          this.empOriginalData = this.empOriginalData.filter(r => r.employeeId !== updatedRow.employeeId);
          this.empDataArray = this.empDataArray.filter(r => r.employeeId !== updatedRow.employeeId);
          this.noRolesOriginalData = [...this.noRolesOriginalData, updatedRow];
          this.noRolesDataArray = [...this.noRolesDataArray, updatedRow];
        } else {
          const idx = this.empOriginalData.findIndex(r => r.employeeId === updatedRow.employeeId);
          if (idx >= 0) this.empOriginalData[idx] = updatedRow;
          const idx2 = this.empDataArray.findIndex(r => r.employeeId === updatedRow.employeeId);
          if (idx2 >= 0) this.empDataArray[idx2] = updatedRow;
        }

        this.notif.showSuccess(`Roles updated for ${email}.`);
        this.isSavingRoles = false;
        this.closeRoleEditor();
        this.cdr.detectChanges();
      },
      error: () => { this.notif.showError('Failed to update roles.'); this.isSavingRoles = false; }
    });
  }

  // ── Set Password ───────────────────────────────────────────────────────────
  openSetPassword(emp: any): void {
    this.setPasswordEmployee = emp;
    this.setPasswordValue = '';
    this.setPasswordConfirm = '';
    this.setPasswordShowNew = false;
    this.setPasswordShowConfirm = false;
    this.showSetPasswordModal = true;
  }

  closeSetPassword(): void {
    this.showSetPasswordModal = false;
    this.setPasswordEmployee = null;
    this.setPasswordValue = '';
    this.setPasswordConfirm = '';
  }

  saveSetPassword(): void {
    if (!this.setPasswordEmployee) return;
    if (!this.setPasswordValue) {
      this.notif.showError('Please enter a new password.');
      return;
    }
    if (this.setPasswordValue.length < 6) {
      this.notif.showError('Password must be at least 6 characters.');
      return;
    }
    if (this.setPasswordValue !== this.setPasswordConfirm) {
      this.notif.showError('Passwords do not match.');
      return;
    }
    this.isSettingPassword = true;
    this.http.post<{ message: string }>(
      `${this.accountSvc.environment.urlAddress}/api/Account/AdminSetPassword`,
      { email: this.setPasswordEmployee.email, newPassword: this.setPasswordValue }
    ).subscribe({
      next: (res) => {
        this.notif.showSuccess(res?.message || 'Password set successfully.');
        this.isSettingPassword = false;
        this.closeSetPassword();
      },
      error: (err) => {
        this.notif.showError(err?.error?.message || 'Failed to set password.');
        this.isSettingPassword = false;
      }
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch { return 'N/A'; }
  }

  // ── HRMSAuthZ assign role modal ────────────────────────────────────────────
  openAdd(): void {
    this.selectedDeptIds = [];
    this.selectedDeptNames = [];
    this.selectedModalEmployees = [];
    this.empModalSearch = '';
    this.form.reset();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  toggleDept(dept: any): void {
    const idx = this.selectedDeptIds.indexOf(dept.departmentId);
    if (idx >= 0) {
      this.selectedDeptIds.splice(idx, 1);
      this.selectedDeptNames.splice(idx, 1);
    } else {
      this.selectedDeptIds.push(dept.departmentId);
      this.selectedDeptNames.push(dept.departmentName);
    }
    this.form.patchValue({
      departmentIds: this.selectedDeptIds.length ? JSON.stringify(this.selectedDeptIds) : null,
      departmentNames: this.selectedDeptNames.length ? this.selectedDeptNames.join(', ') : null
    });
  }

  isDeptSelected(dept: any): boolean {
    return this.selectedDeptIds.includes(dept.departmentId);
  }

  removeDept(deptName: string): void {
    const idx = this.selectedDeptNames.indexOf(deptName);
    if (idx >= 0) {
      this.selectedDeptIds.splice(idx, 1);
      this.selectedDeptNames.splice(idx, 1);
      this.form.patchValue({
        departmentIds: this.selectedDeptIds.length ? JSON.stringify(this.selectedDeptIds) : null,
        departmentNames: this.selectedDeptNames.length ? this.selectedDeptNames.join(', ') : null
      });
    }
  }

  minVal(a: number, b: number): number { return Math.min(a, b); }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.selectedModalEmployees.length) {
      this.notif.showError('Please select at least one employee.');
      return;
    }
    if (this.form.invalid) {
      this.notif.showError('Please select a role.');
      return;
    }
    const v = this.form.getRawValue();
    this.isSaving = true;
    const baseDto = {
      hrmsRoleId: v.hrmsRoleId!,
      hrmsGroupId: v.hrmsGroupId || undefined,
      hrmsCompanyId: v.hrmsCompanyId || undefined,
      hrmsBranchId: v.hrmsBranchId || undefined,
      departmentIds: v.departmentIds || undefined,
      departmentNames: v.departmentNames || undefined
    };
    const calls = this.selectedModalEmployees.map(emp =>
      this.authzSvc.assignRole({ userEmail: emp.email, employeeId: emp.employeeId, ...baseDto })
    );
    forkJoin(calls).subscribe({
      next: () => {
        this.notif.showSuccess(`Role assigned to ${this.selectedModalEmployees.length} employee(s).`);
        this.closeModal();
        this.loadEmployeesWithRoles();
        this.isSaving = false;
      },
      error: (err: any) => {
        this.notif.showError(err?.error?.message ?? 'Failed to assign role.');
        this.isSaving = false;
      }
    });
  }
}
