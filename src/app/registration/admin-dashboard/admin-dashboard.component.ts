import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HrmsAuthzService, AdminDashboardDto, CompanyInsightDto } from '../../shared/services/hrms-authz.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  groups: AdminDashboardDto[] = [];
  loading = true;
  expandedCompany: string | null = null;

  constructor(
    private authzSvc: HrmsAuthzService,
    private notif: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authzSvc.getAdminDashboard().subscribe({
      next: data => { this.groups = data; this.loading = false; },
      error: () => { this.notif.showError('Failed to load dashboard data.'); this.loading = false; }
    });
  }

  get totalCompanies(): number {
    return this.groups.reduce((s, g) => s + g.totalCompanies, 0);
  }

  get totalBranches(): number {
    return this.groups.reduce((s, g) => s + g.totalBranches, 0);
  }

  get totalUsers(): number {
    return this.groups.reduce((s, g) => s + g.totalUsers, 0);
  }

  toggleCompany(id: string): void {
    this.expandedCompany = this.expandedCompany === id ? null : id;
  }

  goToAccessManagement(): void {
    this.router.navigate(['/company/user-access-management']);
  }

  goToCompanyList(): void {
    this.router.navigate(['/company/list']);
  }

  goToCompanyDetails(companyId: string): void {
    this.router.navigate(['/company/details', companyId]);
  }

  goToManageCompanyGroup(): void {
    this.router.navigate(['/company/companyGroup/manage']);
  }

  /** "Total Branches" KPI card: go directly to details if only one company, else show list. */
  goToBranchesOverview(): void {
    const allCompanies = this.groups.flatMap(g => g.companies);
    if (allCompanies.length === 1) {
      this.router.navigate(['/company/details', allCompanies[0].companyId]);
    } else {
      this.router.navigate(['/company/list']);
    }
  }

  goToEmployeeList(companyId: string, branchId: string, branchName: string): void {
    sessionStorage.setItem('adminDashboardBranchFilter', JSON.stringify({ companyId, branchId, branchName }));
    this.router.navigate(['/employee/employeesList']);
  }

  getStatusClass(active: boolean): string {
    return active ? 'status-active' : 'status-inactive';
  }
}
