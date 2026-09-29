import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvironmentUrlService } from './environment-url.service';

export interface HrmsRole {
  hrmsRoleId: string;
  roleName: string;
  roleDisplayName?: string;
  remarks?: string;
  isActive: boolean;
}

export interface HrmsGroupDto {
  groupId: string;
  groupName: string;
  tenantSchema?: string;
  companies: HrmsCompanyDto[];
}

export interface HrmsCompanyDto {
  companyId: string;
  companyName: string;
  companyCode?: string;
  branches: HrmsBranchDto[];
}

export interface HrmsBranchDto {
  branchId: string;
  branchName: string;
  branchCode?: string;
}

export interface AccessibleCompanyDto {
  hrmsGroupId: string;
  groupName: string;
  hrmsCompanyId: string;
  companyName: string;
  companyCode?: string;
  companyLogo?: string;
  roleName: string;
  departmentIds?: string;
  departmentNames?: string;
  branches: { hrmsBranchId: string; branchName: string; branchCode?: string }[];
}

export interface UserAssignmentDto {
  assignmentId: string;
  userEmail: string;
  roleName: string;
  roleDisplayName?: string;
  groupId?: string;
  groupName?: string;
  companyId?: string;
  companyName?: string;
  branchId?: string;
  branchName?: string;
  departmentIds?: string;
  departmentNames?: string;
  isActive: boolean;
  assignedDate: string;
  assignedBy?: string;
}

export interface AssignRoleRequest {
  userEmail: string;
  hrmsRoleId: string;
  hrmsGroupId?: string;
  hrmsCompanyId?: string;
  hrmsBranchId?: string;
  departmentIds?: string;
  departmentNames?: string;
  // Employee Master's EmployeeId - without this, HRMSAuthZ never links the role
  // assignment to a real employee record, which broke employeeId resolution
  // downstream (mobile login, salary slip, etc.) for anyone granted access this way.
  employeeId?: string;
}

export interface UpdateAssignmentRequest {
  hrmsCompanyId?: string;
  hrmsBranchId?: string;
  departmentIds?: string;
  departmentNames?: string;
  isActive: boolean;
}

export interface AdminDashboardDto {
  groupId: string;
  groupName: string;
  tenantSchema?: string;
  totalCompanies: number;
  totalBranches: number;
  totalUsers: number;
  companies: CompanyInsightDto[];
}

export interface CompanyInsightDto {
  companyId: string;
  companyName: string;
  companyCode?: string;
  isActive: boolean;
  branchCount: number;
  userCount: number;
  branches: BranchInsightDto[];
}

export interface BranchInsightDto {
  branchId: string;
  branchName: string;
  branchCode?: string;
  isActive: boolean;
  userCount: number;
}

@Injectable({ providedIn: 'root' })
export class HrmsAuthzService {
  private get base(): string {
    return this.env.hrmsAuthZUrlAddress || '';
  }

  constructor(private http: HttpClient, private env: EnvironmentUrlService) {}

  // ── Roles catalogue ──────────────────────────────────────────────────────

  getRoles(): Observable<HrmsRole[]> {
    return this.http.get<HrmsRole[]>(`${this.base}/api/hrmsauthz/roles`);
  }

  // ── Hierarchy ────────────────────────────────────────────────────────────

  getHierarchy(tenantSchema: string): Observable<HrmsGroupDto[]> {
    return this.http.get<HrmsGroupDto[]>(`${this.base}/api/hrmsauthz/hierarchy`, {
      params: new HttpParams().set('tenantSchema', tenantSchema)
    });
  }

  // ── Assignments ──────────────────────────────────────────────────────────

  assignRole(dto: AssignRoleRequest): Observable<any> {
    return this.http.post(`${this.base}/api/hrmsauthz/assign`, dto);
  }

  updateAssignment(assignmentId: string, dto: UpdateAssignmentRequest): Observable<any> {
    return this.http.put(`${this.base}/api/hrmsauthz/assign/${assignmentId}`, dto);
  }

  revokeAssignment(assignmentId: string): Observable<any> {
    return this.http.delete(`${this.base}/api/hrmsauthz/assign/${assignmentId}`);
  }

  // ── Admin: list all assignments ──────────────────────────────────────────

  getAllAssignments(email?: string): Observable<UserAssignmentDto[]> {
    let params = new HttpParams();
    if (email) params = params.set('email', email);
    return this.http.get<UserAssignmentDto[]>(`${this.base}/api/hrmsauthz/user-assignments`, { params });
  }

  // ── My companies (for company switcher) ──────────────────────────────────

  getMyCompanies(): Observable<AccessibleCompanyDto[]> {
    return this.http.get<AccessibleCompanyDto[]>(`${this.base}/api/hrmsauthz/my-companies`);
  }

  getCompaniesForUser(email: string): Observable<AccessibleCompanyDto[]> {
    return this.http.get<AccessibleCompanyDto[]>(`${this.base}/api/hrmsauthz/my-companies/${email}`);
  }

  // ── Admin dashboard ──────────────────────────────────────────────────────

  getAdminDashboard(): Observable<AdminDashboardDto[]> {
    return this.http.get<AdminDashboardDto[]>(`${this.base}/api/hrmsauthz/admin/dashboard`);
  }

  // ── Permissions ──────────────────────────────────────────────────────────

  getMyPermissions(): Observable<any> {
    return this.http.get(`${this.base}/api/hrmsauthz/permissions`);
  }
}
