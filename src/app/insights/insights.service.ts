import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../_helpers/environment';
import { EnvironmentUrlService } from '../shared/services/environment-url.service';

/* ── Salary (CAB SalaryDashboard) ─────────────────────────────────────── */
export interface SalaryPeriod {
  month: string;
  salaryYear: string;
}

export interface SalaryEmployeeRow {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designationName?: string;
  departmentName?: string;
  monthlyCtcAmount: number;
  paidGrossAmount: number;
  paidNetAmount: number;
  paidDays: number | null;
  joiningDate: string | null;
}

export interface SalaryMonthlyTrend {
  month: string;
  salaryYear: string;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeeCount: number;
}

export interface SalaryInsights {
  kpis: {
    month: string;
    salaryYear: string;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    employeesProcessed: number;
    averageSalary: number;
    attendanceVariance: number;
    totalPaidCurrentFinancialYear: number;
    currentFinancialYearLabel: string;
  };
  allEmployees: SalaryEmployeeRow[];
  monthlyTrend: SalaryMonthlyTrend[];
  tdsInsights?: { totalTaxThisMonth: number };
  currencySymbol: string | null;
}

/* ── Attendance (ALMS) ───────────────────────────────────────────────── */
export interface BranchOption {
  id: string;
  companyBranchName: string;
}

export interface MonthlyAttendanceRow {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designationName?: string;
  departmentName?: string;
  totalHoursWorked: number;
  totalHoursShouldWork: number;
  totalDaysWorked: number;
  unpaidLeaveDays: number;
  weekendOffs: number;
  holidays: number;
  lateIns: number;
  earlyOuts: number;
  absentDays: number;
  notMarkedInOutDays: number;
  overtimeHours: number;
  leaveDaysByType: Record<string, number>;
}

export interface TeamInsights {
  kpis: { totalEmployees: number; avgAttendanceRatePct: number; onLeaveTodayCount: number };
  departmentRates: { departmentName: string; totalEmployees: number; attendanceRatePct: number }[];
  trend: { date: string; attendanceRatePct: number; presentCount: number; totalEmployees: number }[];
}

/* ── Progress Tracker ────────────────────────────────────────────────── */
export interface PerformanceSummary {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  designation?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  onTimeCompletionRate: number;
  kpiAchievementRate: number;
  goalAchievementRate: number;
  overallScore: number;
  performanceBand: string;
  reviewRating?: number;
}

export interface TrackerTask {
  taskItemId: number;
  title: string;
  statusName: string;
  priorityName: string;
  taskTypeName: string;
  assignedToEmployeeId: string;
  assignedToEmployeeName: string;
  projectId?: number;
  projectName?: string;
  departmentName?: string;
  dueDate: string;
  completedDate?: string;
  completionPercentage: number;
  isOverdue: boolean;
}

export interface TrackerProject {
  projectId: number;
  name: string;
  statusName: string;
  priorityName: string;
  projectManagerName: string;
  departmentName?: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  isOverdue: boolean;
  teamMemberCount: number;
}

export interface ProgressMonthlyTrend {
  month: string;
  year: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

function setIf(params: HttpParams, key: string, value: unknown): HttpParams {
  return value !== null && value !== undefined && value !== '' ? params.set(key, String(value)) : params;
}

/**
 * Read-only data access for the Insights dashboard. Every call opts out of the
 * global full-screen loader - the dashboard shows per-section loading states and
 * the three sources load (and fail) independently of each other.
 */
@Injectable({ providedIn: 'root' })
export class InsightsService {
  private readonly quiet = new HttpHeaders({ 'X-Skip-Loader': 'true' });

  constructor(private http: HttpClient, private env: EnvironmentUrlService) {}

  private get salaryBase(): string {
    return `${this.env.salaryUrlAddress}/api/SalaryDashboard`;
  }

  private get almsBase(): string {
    return `${this.env.almsUrlAddress}/api/AttendenceSource`;
  }

  private get progressBase(): string {
    return `${(environment as any).progressUrlAddress || 'http://localhost:5010'}/api`;
  }

  // Progress Tracker resolves the caller's role from these headers (mirrors its own
  // auth.interceptor) in addition to the bearer token the JwtInterceptor attaches.
  private progressHeaders(): HttpHeaders {
    let headers = this.quiet;
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const employeeId = user.employeId || user.employeeId || user.EmployeeId;
      const email = user.email || user.Email;
      if (employeeId) headers = headers.set('X-Employee-Id', String(employeeId));
      if (email) headers = headers.set('X-User-Email', String(email));
    } catch {
      // no session user - token alone
    }
    return headers;
  }

  // Salary
  getSalaryPeriods(branchIds: string[]): Observable<SalaryPeriod[]> {
    let params = new HttpParams();
    branchIds.forEach((id) => (params = params.append('branchIds', id)));
    return this.http.get<SalaryPeriod[]>(`${this.salaryBase}/GetAvailablePeriods`, { params, headers: this.quiet });
  }

  getSalaryInsights(month: string, salaryYear: string, branchIds: string[]): Observable<SalaryInsights> {
    let params = new HttpParams().set('month', month).set('salaryYear', salaryYear).set('trendMonths', '12');
    branchIds.forEach((id) => (params = params.append('branchIds', id)));
    return this.http.get<SalaryInsights>(`${this.salaryBase}/GetInsights`, { params, headers: this.quiet });
  }

  // Attendance
  getBranches(): Observable<BranchOption[]> {
    return this.http.get<BranchOption[]>(`${this.almsBase}/GetCompanyBranch`, { headers: this.quiet });
  }

  getMonthlyAttendance(branchId: string, month: string, year: string): Observable<MonthlyAttendanceRow[]> {
    const params = new HttpParams().set('branchId', branchId).set('month', month).set('year', year);
    return this.http.get<MonthlyAttendanceRow[]>(`${this.almsBase}/GetMonthlyAttendanceReport`, { params, headers: this.quiet });
  }

  getTeamInsights(q: { managerId: string; isAdmin: boolean; branchId?: string; fromDate: string; toDate: string }): Observable<TeamInsights> {
    let params = new HttpParams().set('managerId', q.managerId).set('isAdmin', String(q.isAdmin));
    params = setIf(params, 'branchId', q.branchId);
    params = params.set('fromDate', q.fromDate).set('toDate', q.toDate);
    return this.http.get<TeamInsights>(`${this.almsBase}/GetTeamInsights`, { params, headers: this.quiet });
  }

  // Progress
  getPerformance(fromDate: string, toDate: string, branchId?: string): Observable<PerformanceSummary[]> {
    let params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);
    params = setIf(params, 'branchId', branchId);
    return this.http.get<PerformanceSummary[]>(`${this.progressBase}/Dashboard/performance/employees`, { params, headers: this.progressHeaders() });
  }

  getTasks(fromDate: string, toDate: string, branchId?: string): Observable<TrackerTask[]> {
    let params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);
    params = setIf(params, 'branchId', branchId);
    return this.http.get<TrackerTask[]>(`${this.progressBase}/Task`, { params, headers: this.progressHeaders() });
  }

  getProjects(): Observable<TrackerProject[]> {
    return this.http.get<TrackerProject[]>(`${this.progressBase}/Project`, { headers: this.progressHeaders() });
  }

  getProgressTrend(months: number): Observable<ProgressMonthlyTrend[]> {
    const params = new HttpParams().set('months', String(months));
    return this.http.get<ProgressMonthlyTrend[]>(`${this.progressBase}/Dashboard/trend/monthly`, { params, headers: this.progressHeaders() });
  }
}
