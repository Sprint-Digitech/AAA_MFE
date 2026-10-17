import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import type { ActiveElement, ChartEvent } from 'chart.js';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BranchOption,
  InsightsService,
  MonthlyAttendanceRow,
  PerformanceSummary,
  ProgressMonthlyTrend,
  SalaryInsights,
  SalaryPeriod,
  TeamInsights,
  TrackerProject,
  TrackerTask,
} from './insights.service';
import { ThemeService } from '../shared/services/theme.service';
import { GlobalSearchService } from '../shared/services/global-search.service';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Net-pay buckets for the "amount wise" distribution chart (upper bound exclusive).
const PAY_BUCKETS: { label: string; min: number; max: number | null }[] = [
  { label: '< 15K', min: 0, max: 15000 },
  { label: '15K – 30K', min: 15000, max: 30000 },
  { label: '30K – 50K', min: 30000, max: 50000 },
  { label: '50K – 75K', min: 50000, max: 75000 },
  { label: '75K – 1L', min: 75000, max: 100000 },
  { label: '1L +', min: 100000, max: null },
];

/** One employee, joined across salary, attendance and Progress Tracker for the selected month. */
export interface InsightRow {
  key: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designationName: string;
  // salary
  hasSalary: boolean;
  monthlyCtc: number;
  gross: number;
  net: number;
  paidDays: number | null;
  // attendance
  hasAttendance: boolean;
  daysWorked: number;
  absentDays: number;
  leaveDays: number;
  lateIns: number;
  earlyOuts: number;
  hoursWorked: number;
  overtimeHours: number;
  attendancePct: number | null;
  // progress
  hasProgress: boolean;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number | null;
  onTimeRate: number | null;
  kpiRate: number | null;
  score: number | null;
  band: string;
  projects: string[];
}

type SourceState = 'loading' | 'ready' | 'empty' | 'error' | 'denied';
type GroupBy = 'department' | 'designation' | 'project' | 'band';

interface BreakdownRow {
  name: string;
  headcount: number;
  net: number;
  avgNet: number;
  avgAttendance: number | null;
  absentDays: number;
  tasks: number;
  completed: number;
  overdue: number;
  avgScore: number | null;
}

interface Filters {
  search: string;
  department: string;
  designation: string;
  project: string;
  taskStatus: string;
  priority: string;
  band: string;
  attendance: '' | 'high' | 'mid' | 'low' | 'none';
  coverage: '' | 'salary' | 'attendance' | 'progress' | 'all';
  minNet: number | null;
  maxNet: number | null;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  department: '',
  designation: '',
  project: '',
  taskStatus: '',
  priority: '',
  band: '',
  attendance: '',
  coverage: '',
  minNet: null,
  maxNet: null,
};

@Component({
  selector: 'app-insights-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './insights-dashboard.component.html',
  styleUrl: './insights-dashboard.component.scss',
})
export class InsightsDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('deptChart') deptCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('attTrendChart') attTrendCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('bandChart') bandCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('taskChart') taskCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('payChart') payCanvas?: ElementRef<HTMLCanvasElement>;

  readonly months = MONTHS;
  readonly payBuckets = PAY_BUCKETS;
  years: string[] = [];
  selectedMonth = '';
  selectedYear = '';
  branches: BranchOption[] = [];
  selectedBranchId = '';
  periods: SalaryPeriod[] = [];

  f: Filters = { ...EMPTY_FILTERS };
  showMoreFilters = false;
  // Computed once per filter change. Must not be a getter: a fresh array of fresh
  // objects on every check makes *ngFor rebuild the chip views mid change-detection,
  // which re-dirties the page and spins change detection forever (the filter freeze).
  chips: { label: string; clear: () => void }[] = [];

  salaryState: SourceState = 'loading';
  attendanceState: SourceState = 'loading';
  progressState: SourceState = 'loading';

  salary: SalaryInsights | null = null;
  attendance: MonthlyAttendanceRow[] = [];
  teamInsights: TeamInsights | null = null;
  performance: PerformanceSummary[] = [];
  tasks: TrackerTask[] = [];
  projects: TrackerProject[] = [];
  progressTrend: ProgressMonthlyTrend[] = [];

  rows: InsightRow[] = [];
  filtered: InsightRow[] = [];
  filteredTasks: TrackerTask[] = [];
  filteredProjects: TrackerProject[] = [];
  pageRows: InsightRow[] = [];

  departments: string[] = [];
  designations: string[] = [];
  projectNames: string[] = [];
  taskStatuses: string[] = [];
  priorities: string[] = [];
  bands: string[] = [];

  summary = this.emptySummary();
  groupBy: GroupBy = 'department';
  breakdown: BreakdownRow[] = [];
  topPerformers: InsightRow[] = [];
  needsAttention: { row: InsightRow; reasons: string[] }[] = [];

  sortKey: keyof InsightRow = 'net';
  sortDir: 1 | -1 = -1;
  page = 0;
  readonly pageSize = 25;

  currency = '₹';
  lastUpdated: Date | null = null;

  private charts: Record<string, Chart | undefined> = {};
  private statusesByEmployee = new Map<string, Set<string>>();
  private prioritiesByEmployee = new Map<string, Set<string>>();
  private loadSeq = 0;
  private themeSub?: Subscription;
  private releaseNative?: () => void;
  private managerId = '';
  private isAdmin = false;
  // Header search term (the shell's one search box drives every screen).
  private searchText = '';
  private unsubscribeSearch?: () => void;

  constructor(
    private api: InsightsService,
    private theme: ThemeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private globalSearch: GlobalSearchService,
  ) {}

  ngOnInit(): void {
    this.releaseNative = this.theme.claimNative();
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      this.managerId = user.employeId || user.employeeId || '';
      const roles: any[] = user.roles || user.employeeRoleLoginDtos || [];
      this.isAdmin = roles.some((r: any) => (r?.roleName || r?.RoleName || '').toLowerCase() === 'admin');
    } catch {
      // no session user
    }

    // Charts read their colours from the theme tokens, so redraw on every switch.
    this.themeSub = this.theme.theme$.subscribe(() => setTimeout(() => this.renderCharts(), 0));

    this.unsubscribeSearch = this.globalSearch.registerConsumer((term) => {
      this.searchText = (term || '').toLowerCase().trim();
      if (this.rows.length) this.applyFilters();
    });

    const now = new Date();
    this.selectedMonth = MONTHS[now.getMonth()];
    this.selectedYear = String(now.getFullYear());
    this.buildYears();

    this.api.getBranches().pipe(catchError(() => of([] as BranchOption[]))).subscribe((branches) => {
      this.branches = branches || [];
      this.loadPeriodsThenData();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeSearch?.();
    this.releaseNative?.();
    this.themeSub?.unsubscribe();
    Object.values(this.charts).forEach((c) => c?.destroy());
  }

  /* ── Loading ───────────────────────────────────────────────────────── */

  private get branchIds(): string[] {
    return this.selectedBranchId ? [this.selectedBranchId] : [];
  }

  private loadPeriodsThenData(): void {
    this.api.getSalaryPeriods(this.branchIds).pipe(catchError(() => of([] as SalaryPeriod[]))).subscribe((periods) => {
      this.periods = periods || [];
      // Default to the latest processed payroll month - the current month usually has no salary yet.
      const latest = this.sortedPeriods()[0];
      if (latest && !this.hasPeriod(this.selectedMonth, this.selectedYear)) {
        this.selectedMonth = latest.month;
        this.selectedYear = latest.salaryYear;
      }
      this.buildYears();
      this.loadAll();
    });
  }

  onPeriodChange(): void {
    this.loadAll();
  }

  onBranchChange(): void {
    this.loadPeriodsThenData();
  }

  loadAll(): void {
    const seq = ++this.loadSeq;
    // Attendance stops at today; Progress filters tasks by due date, so it gets the whole month.
    const { fromDate, toDate, monthEnd } = this.monthRange();
    this.salaryState = this.attendanceState = this.progressState = 'loading';

    // Salary
    this.api.getSalaryInsights(this.selectedMonth, this.selectedYear, this.branchIds).subscribe({
      next: (res) => {
        if (seq !== this.loadSeq) return;
        this.salary = res;
        this.currency = res?.currencySymbol || '₹';
        this.salaryState = res?.allEmployees?.length ? 'ready' : 'empty';
        this.rebuild();
      },
      error: (err) => {
        if (seq !== this.loadSeq) return;
        this.salary = null;
        this.salaryState = err?.status === 403 ? 'denied' : 'error';
        this.rebuild();
      },
    });

    // Attendance - the monthly report is per branch, so "All branches" fans out.
    const branchIds = this.selectedBranchId ? [this.selectedBranchId] : this.branches.map((b) => b.id);
    const attendance$: Observable<{ rows: MonthlyAttendanceRow[]; failed: number }> = branchIds.length
      ? forkJoin(
        branchIds.map((id) =>
          this.api.getMonthlyAttendance(id, this.selectedMonth, this.selectedYear).pipe(
            map((rows) => ({ rows: rows || [], ok: true })),
            catchError(() => of({ rows: [] as MonthlyAttendanceRow[], ok: false })),
          ),
        ),
      ).pipe(map((parts) => ({ rows: parts.flatMap((p) => p.rows), failed: parts.filter((p) => !p.ok).length })))
      : of({ rows: [], failed: 1 });

    forkJoin({
      att: attendance$,
      team: this.managerId
        ? this.api
          .getTeamInsights({ managerId: this.managerId, isAdmin: this.isAdmin, branchId: this.selectedBranchId || undefined, fromDate, toDate })
          .pipe(catchError(() => of(null)))
        : of(null),
    }).subscribe(({ att, team }) => {
      if (seq !== this.loadSeq) return;
      this.attendance = att.rows;
      this.teamInsights = team;
      this.attendanceState = att.rows.length ? 'ready' : att.failed === branchIds.length && branchIds.length > 0 ? 'error' : att.failed ? 'error' : 'empty';
      this.rebuild();
    });

    // Progress Tracker - admin/HR only, and a separate service that may be offline.
    let denied = false;
    const guard = <T>(obs: Observable<T>, fallback: T) =>
      obs.pipe(
        catchError((err) => {
          if (err?.status === 403 || err?.status === 401) denied = true;
          return of(fallback);
        }),
      );
    let anyOk = false;
    const track = <T>(obs: Observable<T>, fallback: T) =>
      guard(obs.pipe(map((v) => ((anyOk = true), v))), fallback);

    forkJoin({
      perf: track(this.api.getPerformance(fromDate, monthEnd, this.selectedBranchId || undefined), [] as PerformanceSummary[]),
      tasks: track(this.api.getTasks(fromDate, monthEnd, this.selectedBranchId || undefined), [] as TrackerTask[]),
      projects: track(this.api.getProjects(), [] as TrackerProject[]),
      trend: track(this.api.getProgressTrend(12), [] as ProgressMonthlyTrend[]),
    }).subscribe(({ perf, tasks, projects, trend }) => {
      if (seq !== this.loadSeq) return;
      this.performance = perf || [];
      this.tasks = tasks || [];
      this.projects = projects || [];
      this.progressTrend = trend || [];
      this.progressState = denied ? 'denied' : !anyOk ? 'error' : this.performance.length || this.tasks.length ? 'ready' : 'empty';
      this.lastUpdated = new Date();
      this.rebuild();
    });
  }

  refresh(): void {
    this.loadAll();
  }

  get isLoading(): boolean {
    return this.salaryState === 'loading' || this.attendanceState === 'loading' || this.progressState === 'loading';
  }

  /* ── Merge the three sources into one row per employee ─────────────── */

  private rebuild(): void {
    const byKey = new Map<string, InsightRow>();
    const byName = new Map<string, InsightRow>();
    const keyOf = (id: unknown) => String(id || '').trim().toLowerCase();
    const nameOf = (n: unknown) => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');

    const ensure = (id: string, name: string, seed: Partial<InsightRow>): InsightRow => {
      const key = keyOf(id);
      let row = (key && byKey.get(key)) || byName.get(nameOf(name));
      if (!row) {
        row = this.blankRow(key || `name:${nameOf(name)}`, id, name);
        byKey.set(row.key, row);
        if (nameOf(name)) byName.set(nameOf(name), row);
      }
      row.employeeCode ||= seed.employeeCode || '';
      row.departmentName ||= seed.departmentName || '';
      row.designationName ||= seed.designationName || '';
      return row;
    };

    for (const s of this.salary?.allEmployees || []) {
      const row = ensure(s.employeeId, s.employeeName, {
        employeeCode: s.employeeCode,
        departmentName: s.departmentName,
        designationName: s.designationName,
      });
      row.hasSalary = true;
      row.monthlyCtc = s.monthlyCtcAmount || 0;
      row.gross = s.paidGrossAmount || 0;
      row.net = s.paidNetAmount || 0;
      row.paidDays = s.paidDays;
    }

    for (const a of this.attendance) {
      const row = ensure(a.employeeId, a.employeeName, {
        employeeCode: a.employeeCode,
        departmentName: a.departmentName,
        designationName: a.designationName,
      });
      row.hasAttendance = true;
      row.daysWorked = a.totalDaysWorked || 0;
      row.absentDays = a.absentDays || 0;
      row.lateIns = a.lateIns || 0;
      row.earlyOuts = a.earlyOuts || 0;
      row.hoursWorked = a.totalHoursWorked || 0;
      row.overtimeHours = a.overtimeHours || 0;
      row.leaveDays = Object.values(a.leaveDaysByType || {}).reduce((sum, d) => sum + (Number(d) || 0), 0) + (a.unpaidLeaveDays || 0);
      // Working days = days present + days absent + half-marked days; leave/holidays/week-offs are excused.
      const workingDays = row.daysWorked + row.absentDays + (a.notMarkedInOutDays || 0);
      row.attendancePct = workingDays > 0 ? Math.round((row.daysWorked / workingDays) * 1000) / 10 : null;
    }

    for (const p of this.performance) {
      const row = ensure(p.employeeId, p.employeeName, { departmentName: p.departmentName, designationName: p.designation });
      row.hasProgress = true;
      row.totalTasks = p.totalTasks || 0;
      row.completedTasks = p.completedTasks || 0;
      row.overdueTasks = p.overdueTasks || 0;
      row.taskCompletionRate = this.round1(p.taskCompletionRate);
      row.onTimeRate = this.round1(p.onTimeCompletionRate);
      row.kpiRate = this.round1(p.kpiAchievementRate);
      row.score = this.round1(p.overallScore);
      row.band = p.performanceBand || '';
    }

    // Task-level facts (project, status, priority) per assignee.
    this.statusesByEmployee.clear();
    this.prioritiesByEmployee.clear();
    const projectsByEmployee = new Map<string, Set<string>>();
    for (const t of this.tasks) {
      const k = keyOf(t.assignedToEmployeeId);
      if (!k) continue;
      const add = (m: Map<string, Set<string>>, v?: string) => {
        if (!v) return;
        if (!m.has(k)) m.set(k, new Set());
        m.get(k)!.add(v);
      };
      add(projectsByEmployee, t.projectName);
      add(this.statusesByEmployee, t.statusName);
      add(this.prioritiesByEmployee, t.priorityName);
    }

    this.rows = Array.from(new Set(byKey.values())).map((r) => ({
      ...r,
      projects: Array.from(projectsByEmployee.get(r.key) || []),
    }));

    const uniq = (vals: (string | undefined)[]) =>
      Array.from(new Set(vals.filter((v): v is string => !!v && !!v.trim()))).sort((a, b) => a.localeCompare(b));
    this.departments = uniq(this.rows.map((r) => r.departmentName));
    this.designations = uniq(this.rows.map((r) => r.designationName));
    this.projectNames = uniq([...this.tasks.map((t) => t.projectName), ...this.projects.map((p) => p.name)]);
    this.taskStatuses = uniq(this.tasks.map((t) => t.statusName));
    this.priorities = uniq(this.tasks.map((t) => t.priorityName));
    this.bands = uniq(this.rows.map((r) => r.band));

    this.applyFilters();
  }

  /* ── Filtering ─────────────────────────────────────────────────────── */

  applyFilters(): void {
    const f = this.f;
    const q = (this.searchText || f.search.trim().toLowerCase());

    this.filtered = this.rows.filter((r) => {
      if (q && !`${r.employeeName} ${r.employeeCode}`.toLowerCase().includes(q)) return false;
      if (f.department && r.departmentName !== f.department) return false;
      if (f.designation && r.designationName !== f.designation) return false;
      if (f.project && !r.projects.includes(f.project)) return false;
      if (f.taskStatus && !this.statusesByEmployee.get(r.key)?.has(f.taskStatus)) return false;
      if (f.priority && !this.prioritiesByEmployee.get(r.key)?.has(f.priority)) return false;
      if (f.band && r.band !== f.band) return false;
      if (f.minNet != null && (!r.hasSalary || r.net < f.minNet)) return false;
      if (f.maxNet != null && (!r.hasSalary || r.net >= f.maxNet)) return false;
      if (f.attendance) {
        const pct = r.attendancePct;
        if (f.attendance === 'none' && pct != null) return false;
        if (f.attendance === 'high' && (pct == null || pct < 95)) return false;
        if (f.attendance === 'mid' && (pct == null || pct < 80 || pct >= 95)) return false;
        if (f.attendance === 'low' && (pct == null || pct >= 80)) return false;
      }
      if (f.coverage === 'salary' && !r.hasSalary) return false;
      if (f.coverage === 'attendance' && !r.hasAttendance) return false;
      if (f.coverage === 'progress' && !r.hasProgress) return false;
      if (f.coverage === 'all' && !(r.hasSalary && r.hasAttendance && r.hasProgress)) return false;
      return true;
    });

    const inScope = new Set(this.filtered.map((r) => r.key));
    const employeeFilterActive = this.filtered.length !== this.rows.length;
    this.filteredTasks = this.tasks.filter((t) => {
      if (employeeFilterActive && !inScope.has(String(t.assignedToEmployeeId || '').toLowerCase())) return false;
      if (f.project && t.projectName !== f.project) return false;
      if (f.taskStatus && t.statusName !== f.taskStatus) return false;
      if (f.priority && t.priorityName !== f.priority) return false;
      return true;
    });

    const projectsWithTasks = new Set(this.filteredTasks.map((t) => t.projectName).filter(Boolean));
    this.filteredProjects = this.projects
      .filter((p) => {
        if (f.project) return p.name === f.project;
        if (f.department && p.departmentName && p.departmentName !== f.department) return projectsWithTasks.has(p.name);
        if (employeeFilterActive) return projectsWithTasks.has(p.name) || (!!f.department && p.departmentName === f.department);
        return true;
      })
      .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || a.completionPercentage - b.completionPercentage);

    this.page = 0;
    this.chips = this.buildChips();
    this.computeSummary();
    this.computeBreakdown();
    this.computeLists();
    this.sortRows();
    this.cdr.markForCheck();
    setTimeout(() => this.renderCharts(), 0);
  }

  resetFilters(): void {
    this.f = { ...EMPTY_FILTERS };
    this.applyFilters();
  }

  setPayBucket(index: number): void {
    const b = PAY_BUCKETS[index];
    const same = this.f.minNet === b.min && this.f.maxNet === b.max;
    this.f.minNet = same ? null : b.min;
    this.f.maxNet = same ? null : b.max;
    this.applyFilters();
  }

  trackChip = (_: number, c: { label: string }) => c.label;

  private buildChips(): { label: string; clear: () => void }[] {
    const f = this.f;
    const chips: { label: string; clear: () => void }[] = [];
    const add = (cond: unknown, label: string, clear: () => void) => {
      if (cond) chips.push({ label, clear: () => { clear(); this.applyFilters(); } });
    };
    add(f.search.trim(), `“${f.search.trim()}”`, () => (f.search = ''));
    add(f.department, `Dept: ${f.department}`, () => (f.department = ''));
    add(f.designation, `Designation: ${f.designation}`, () => (f.designation = ''));
    add(f.project, `Project: ${f.project}`, () => (f.project = ''));
    add(f.taskStatus, `Task: ${f.taskStatus}`, () => (f.taskStatus = ''));
    add(f.priority, `Priority: ${f.priority}`, () => (f.priority = ''));
    add(f.band, `Performance: ${f.band}`, () => (f.band = ''));
    add(f.minNet != null || f.maxNet != null, `Net ${this.amountRangeLabel()}`, () => { f.minNet = null; f.maxNet = null; });
    const attLabels: Record<string, string> = { high: '≥ 95%', mid: '80–95%', low: '< 80%', none: 'No data' };
    add(f.attendance, `Attendance ${attLabels[f.attendance] || ''}`, () => (f.attendance = ''));
    const covLabels: Record<string, string> = { salary: 'With salary', attendance: 'With attendance', progress: 'With progress', all: 'In all 3 sources' };
    add(f.coverage, covLabels[f.coverage] || '', () => (f.coverage = ''));
    return chips;
  }

  private amountRangeLabel(): string {
    const { minNet, maxNet } = this.f;
    if (minNet != null && maxNet != null) return `${this.short(minNet)} – ${this.short(maxNet)}`;
    if (minNet != null) return `≥ ${this.short(minNet)}`;
    return `< ${this.short(maxNet || 0)}`;
  }

  /* ── Aggregates ────────────────────────────────────────────────────── */

  private emptySummary() {
    return {
      headcount: 0,
      paidCount: 0,
      net: 0,
      gross: 0,
      ctc: 0,
      avgNet: 0,
      deductions: 0,
      avgAttendance: null as number | null,
      absentDays: 0,
      leaveDays: 0,
      lateIns: 0,
      overtime: 0,
      tasks: 0,
      completed: 0,
      overdue: 0,
      completionRate: null as number | null,
      avgScore: null as number | null,
      activeProjects: 0,
    };
  }

  private computeSummary(): void {
    const s = this.emptySummary();
    const rows = this.filtered;
    s.headcount = rows.length;
    let attSum = 0, attN = 0, scoreSum = 0, scoreN = 0;
    for (const r of rows) {
      if (r.hasSalary) {
        s.paidCount++;
        s.net += r.net;
        s.gross += r.gross;
        s.ctc += r.monthlyCtc;
      }
      if (r.attendancePct != null) { attSum += r.attendancePct; attN++; }
      s.absentDays += r.absentDays;
      s.leaveDays += r.leaveDays;
      s.lateIns += r.lateIns;
      s.overtime += r.overtimeHours;
      if (r.score != null) { scoreSum += r.score; scoreN++; }
    }
    s.avgNet = s.paidCount ? s.net / s.paidCount : 0;
    s.deductions = Math.max(0, s.gross - s.net);
    s.avgAttendance = attN ? Math.round((attSum / attN) * 10) / 10 : null;
    s.avgScore = scoreN ? Math.round((scoreSum / scoreN) * 10) / 10 : null;

    // Task counts from the task list when we have it (exact per filter), else from performance summaries.
    if (this.tasks.length) {
      s.tasks = this.filteredTasks.length;
      s.completed = this.filteredTasks.filter((t) => this.isDone(t.statusName)).length;
      s.overdue = this.filteredTasks.filter((t) => t.isOverdue).length;
    } else {
      s.tasks = rows.reduce((a, r) => a + r.totalTasks, 0);
      s.completed = rows.reduce((a, r) => a + r.completedTasks, 0);
      s.overdue = rows.reduce((a, r) => a + r.overdueTasks, 0);
    }
    s.completionRate = s.tasks ? Math.round((s.completed / s.tasks) * 1000) / 10 : null;
    s.activeProjects = this.filteredProjects.filter((p) => !this.isDone(p.statusName)).length;
    this.summary = s;
  }

  setGroupBy(g: GroupBy): void {
    this.groupBy = g;
    this.computeBreakdown();
  }

  private computeBreakdown(): void {
    const groups = new Map<string, InsightRow[]>();
    const push = (name: string, r: InsightRow) => {
      const k = name || 'Unassigned';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    };
    for (const r of this.filtered) {
      if (this.groupBy === 'department') push(r.departmentName, r);
      else if (this.groupBy === 'designation') push(r.designationName, r);
      else if (this.groupBy === 'band') push(r.band || (r.hasProgress ? 'Unrated' : 'No progress data'), r);
      else if (r.projects.length) r.projects.forEach((p) => push(p, r));
      else push('No project', r);
    }
    this.breakdown = Array.from(groups.entries())
      .map(([name, rs]) => {
        const paid = rs.filter((r) => r.hasSalary);
        const att = rs.filter((r) => r.attendancePct != null);
        const scored = rs.filter((r) => r.score != null);
        const net = paid.reduce((a, r) => a + r.net, 0);
        return {
          name,
          headcount: rs.length,
          net,
          avgNet: paid.length ? net / paid.length : 0,
          avgAttendance: att.length ? Math.round((att.reduce((a, r) => a + (r.attendancePct || 0), 0) / att.length) * 10) / 10 : null,
          absentDays: rs.reduce((a, r) => a + r.absentDays, 0),
          tasks: rs.reduce((a, r) => a + r.totalTasks, 0),
          completed: rs.reduce((a, r) => a + r.completedTasks, 0),
          overdue: rs.reduce((a, r) => a + r.overdueTasks, 0),
          avgScore: scored.length ? Math.round((scored.reduce((a, r) => a + (r.score || 0), 0) / scored.length) * 10) / 10 : null,
        } as BreakdownRow;
      })
      .sort((a, b) => b.net - a.net || b.headcount - a.headcount);
  }

  drillInto(b: BreakdownRow): void {
    if (b.name === 'Unassigned' || b.name === 'No project' || b.name === 'No progress data' || b.name === 'Unrated') return;
    if (this.groupBy === 'department') this.f.department = this.f.department === b.name ? '' : b.name;
    else if (this.groupBy === 'designation') this.f.designation = this.f.designation === b.name ? '' : b.name;
    else if (this.groupBy === 'project') this.f.project = this.f.project === b.name ? '' : b.name;
    else this.f.band = this.f.band === b.name ? '' : b.name;
    this.applyFilters();
  }

  isDrilled(b: BreakdownRow): boolean {
    return (
      (this.groupBy === 'department' && this.f.department === b.name) ||
      (this.groupBy === 'designation' && this.f.designation === b.name) ||
      (this.groupBy === 'project' && this.f.project === b.name) ||
      (this.groupBy === 'band' && this.f.band === b.name)
    );
  }

  private computeLists(): void {
    this.topPerformers = this.filtered
      .filter((r) => r.score != null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6);

    this.needsAttention = this.filtered
      .map((row) => {
        const reasons: string[] = [];
        if (row.attendancePct != null && row.attendancePct < 80) reasons.push(`${row.attendancePct}% attendance`);
        if (row.absentDays >= 3) reasons.push(`${row.absentDays} absent days`);
        if (row.overdueTasks > 0) reasons.push(`${row.overdueTasks} overdue task${row.overdueTasks > 1 ? 's' : ''}`);
        if (row.score != null && row.score < 50) reasons.push(`score ${row.score}`);
        return { row, reasons };
      })
      .filter((x) => x.reasons.length)
      .sort((a, b) => b.reasons.length - a.reasons.length || (a.row.attendancePct ?? 100) - (b.row.attendancePct ?? 100))
      .slice(0, 6);
  }

  /* ── Table ─────────────────────────────────────────────────────────── */

  sortBy(key: keyof InsightRow): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 1 ? -1 : 1;
    else {
      this.sortKey = key;
      this.sortDir = typeof this.rows[0]?.[key] === 'string' ? 1 : -1;
    }
    this.page = 0;
    this.sortRows();
  }

  private sortRows(): void {
    const k = this.sortKey;
    const dir = this.sortDir;
    this.filtered = [...this.filtered].sort((a, b) => {
      const av = a[k] as any;
      const bv = b[k] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // blanks always last
      if (bv == null) return -1;
      if (typeof av === 'string') return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
    this.updatePage();
  }

  /** KPI shortcut: sort the employee table by a column and bring it into view. */
  focusTable(key: keyof InsightRow, dir: 1 | -1): void {
    this.sortKey = key;
    this.sortDir = dir;
    this.page = 0;
    this.sortRows();
    this.jump('ins-employees');
  }

  jump(id: string): void {
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  goToPage(p: number): void {
    this.page = Math.min(Math.max(0, p), this.pageCount - 1);
    this.updatePage();
  }

  private updatePage(): void {
    const start = this.page * this.pageSize;
    this.pageRows = this.filtered.slice(start, start + this.pageSize);
  }

  openEmployee(r: InsightRow): void {
    if (!r.employeeId || r.key.startsWith('name:')) return;
    this.router.navigate(['/employee/employee-profile', r.employeeId]);
  }

  exportCsv(): void {
    const headers = [
      'Employee Code', 'Employee Name', 'Department', 'Designation',
      'Monthly CTC', 'Gross Paid', 'Net Paid', 'Paid Days',
      'Days Worked', 'Absent Days', 'Leave Days', 'Late Ins', 'Early Outs', 'Hours Worked', 'Overtime Hours', 'Attendance %',
      'Tasks', 'Completed', 'Overdue', 'Task Completion %', 'On-time %', 'KPI %', 'Performance Score', 'Performance Band', 'Projects',
    ];
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of this.filtered) {
      lines.push([
        r.employeeCode, r.employeeName, r.departmentName, r.designationName,
        r.hasSalary ? r.monthlyCtc : '', r.hasSalary ? r.gross : '', r.hasSalary ? r.net : '', r.paidDays ?? '',
        r.hasAttendance ? r.daysWorked : '', r.hasAttendance ? r.absentDays : '', r.hasAttendance ? r.leaveDays : '',
        r.hasAttendance ? r.lateIns : '', r.hasAttendance ? r.earlyOuts : '', r.hasAttendance ? r.hoursWorked : '',
        r.hasAttendance ? r.overtimeHours : '', r.attendancePct ?? '',
        r.hasProgress ? r.totalTasks : '', r.hasProgress ? r.completedTasks : '', r.hasProgress ? r.overdueTasks : '',
        r.taskCompletionRate ?? '', r.onTimeRate ?? '', r.kpiRate ?? '', r.score ?? '', r.band, r.projects.join('; '),
      ].map(esc).join(','));
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `insights-${this.selectedMonth}-${this.selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Charts ────────────────────────────────────────────────────────── */

  private token(name: string, fallback: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  private palette(): string[] {
    return [
      this.token('--fv-accent', '#4f46e5'),
      this.token('--fv-highlight', '#f97316'),
      this.token('--fv-success', '#10b981'),
      this.token('--fv-info', '#3b82f6'),
      this.token('--fv-warning', '#f59e0b'),
      this.token('--fv-accent-2', '#7c3aed'),
      this.token('--fv-danger', '#ef4444'),
      '#14b8a6',
      '#ec4899',
      '#84cc16',
    ];
  }

  private draw(id: string, canvas: ElementRef<HTMLCanvasElement> | undefined, config: ChartConfiguration<any, any, any> | null): void {
    this.charts[id]?.destroy();
    this.charts[id] = undefined;
    if (!canvas || !config) return;
    try {
      this.charts[id] = new Chart(canvas.nativeElement, config);
    } catch (e) {
      console.error(`[Insights] ${id} chart failed`, e);
    }
  }

  private renderCharts(): void {
    const text2 = this.token('--fv-text-2', '#475569');
    const grid = this.token('--fv-chart-grid', 'rgba(15,23,42,0.06)');
    const surface = this.token('--fv-surface-solid', '#ffffff');
    Chart.defaults.color = text2;
    Chart.defaults.borderColor = grid;
    Chart.defaults.font.family = 'Poppins, sans-serif';
    Chart.defaults.font.size = 11;
    const pal = this.palette();
    const [accent, highlight, success, info, warning, accent2, danger] = pal;
    const tooltip = { backgroundColor: this.token('--fv-text', '#0f172a'), titleColor: surface, bodyColor: surface, padding: 10, cornerRadius: 10 };
    const fmtMoney = (v: number | string) => this.short(Number(v));

    // Department (or current group) payroll vs attendance
    const depts = this.breakdownBy('department').slice(0, 10);
    this.draw('dept', this.deptCanvas, depts.length ? {
      type: 'bar',
      data: {
        labels: depts.map((d) => d.name),
        datasets: [
          { type: 'bar', label: 'Net payroll', data: depts.map((d) => d.net), backgroundColor: accent, borderRadius: 8, maxBarThickness: 34, yAxisID: 'y' },
          { type: 'line', label: 'Avg attendance %', data: depts.map((d) => d.avgAttendance), borderColor: highlight, backgroundColor: highlight, tension: 0.35, pointRadius: 4, yAxisID: 'y1' } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        onClick: (_e: ChartEvent, els: ActiveElement[]) => {
          const d = els.length ? depts[els[0].index] : null;
          if (d && d.name !== 'Unassigned') {
            this.f.department = this.f.department === d.name ? '' : d.name;
            this.applyFilters();
          }
        },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip },
        scales: {
          x: { grid: { display: false }, ticks: { autoSkip: true, maxRotation: 40 } },
          y: { beginAtZero: true, ticks: { callback: fmtMoney } },
          y1: { beginAtZero: true, max: 100, position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: (v: number | string) => `${v}%` } },
        },
      },
    } : null);

    // Payroll trend (12 months) + task completion rate
    const trend = this.salary?.monthlyTrend || [];
    const progressByMonth = new Map(this.progressTrend.map((p) => [`${String(p.month).slice(0, 3).toLowerCase()}-${p.year}`, p.completionRate]));
    const ctx = this.trendCanvas?.nativeElement.getContext('2d');
    let fill: CanvasGradient | string = this.token('--fv-accent-soft', 'rgba(79,70,229,0.1)');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 260);
      g.addColorStop(0, this.hexA(accent, 0.35));
      g.addColorStop(1, this.hexA(accent, 0));
      fill = g;
    }
    const hasProgressTrend = trend.some((t) => progressByMonth.has(`${t.month.slice(0, 3).toLowerCase()}-${t.salaryYear}`));
    this.draw('trend', this.trendCanvas, trend.length ? {
      type: 'line',
      data: {
        labels: trend.map((t) => `${t.month.slice(0, 3)} ${String(t.salaryYear).slice(-2)}`),
        datasets: [
          { label: 'Net paid', data: trend.map((t) => t.totalNet), borderColor: accent, backgroundColor: fill, fill: true, tension: 0.4, pointRadius: 3, yAxisID: 'y' },
          { label: 'Gross', data: trend.map((t) => t.totalGross), borderColor: accent2, borderDash: [6, 4], fill: false, tension: 0.4, pointRadius: 0, yAxisID: 'y' },
          ...(hasProgressTrend
            ? [{
              label: 'Task completion %',
              data: trend.map((t) => progressByMonth.get(`${t.month.slice(0, 3).toLowerCase()}-${t.salaryYear}`) ?? null),
              borderColor: success, backgroundColor: success, fill: false, tension: 0.4, pointRadius: 3, yAxisID: 'y1', spanGaps: true,
            }]
            : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { callback: fmtMoney } },
          ...(hasProgressTrend ? { y1: { beginAtZero: true, max: 100, position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { callback: (v: number | string) => `${v}%` } } } : {}),
        },
      },
    } : null);

    // Daily attendance trend for the month
    const att = this.teamInsights?.trend || [];
    this.draw('attTrend', this.attTrendCanvas, att.length ? {
      type: 'line',
      data: {
        labels: att.map((p) => new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
        datasets: [{
          label: 'Attendance %', data: att.map((p) => p.attendanceRatePct), borderColor: success,
          backgroundColor: this.hexA(success, 0.15), fill: true, tension: 0.35, pointRadius: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: { beginAtZero: true, max: 100, ticks: { callback: (v: number | string) => `${v}%` } } },
      },
    } : null);

    // Performance bands
    const bandCounts = this.countBy(this.filtered.filter((r) => r.band), (r) => r.band);
    this.draw('band', this.bandCanvas, bandCounts.length ? {
      type: 'doughnut',
      data: {
        labels: bandCounts.map((b) => b[0]),
        datasets: [{ data: bandCounts.map((b) => b[1]), backgroundColor: pal, borderColor: surface, borderWidth: 3 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        onClick: (_e: ChartEvent, els: ActiveElement[]) => {
          const b = els.length ? bandCounts[els[0].index] : null;
          if (b) { this.f.band = this.f.band === b[0] ? '' : b[0]; this.applyFilters(); }
        },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip },
      },
    } : null);

    // Task status mix
    const statusCounts = this.countBy(this.filteredTasks, (t) => t.statusName || 'Unknown');
    const statusColor = (s: string) => {
      const k = s.toLowerCase();
      if (this.isDone(s)) return success;
      if (k.includes('progress')) return info;
      if (k.includes('review')) return accent2;
      if (k.includes('hold') || k.includes('block')) return warning;
      if (k.includes('cancel') || k.includes('reject')) return danger;
      return this.token('--fv-text-3', '#94a3b8');
    };
    this.draw('task', this.taskCanvas, statusCounts.length ? {
      type: 'doughnut',
      data: {
        labels: statusCounts.map((s) => s[0]),
        datasets: [{ data: statusCounts.map((s) => s[1]), backgroundColor: statusCounts.map((s) => statusColor(s[0])), borderColor: surface, borderWidth: 3 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        onClick: (_e: ChartEvent, els: ActiveElement[]) => {
          const s = els.length ? statusCounts[els[0].index] : null;
          if (s) { this.f.taskStatus = this.f.taskStatus === s[0] ? '' : s[0]; this.applyFilters(); }
        },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip },
      },
    } : null);

    // Net pay distribution (click a bar to filter by amount)
    const paid = this.filtered.filter((r) => r.hasSalary);
    const bucketCounts = PAY_BUCKETS.map((b) => paid.filter((r) => r.net >= b.min && (b.max == null || r.net < b.max)).length);
    this.draw('pay', this.payCanvas, paid.length ? {
      type: 'bar',
      data: {
        labels: PAY_BUCKETS.map((b) => b.label),
        datasets: [{
          label: 'Employees',
          data: bucketCounts,
          backgroundColor: PAY_BUCKETS.map((b) => (this.f.minNet === b.min && this.f.maxNet === b.max ? highlight : this.hexA(accent, 0.75))),
          borderRadius: 8,
          maxBarThickness: 40,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_e: ChartEvent, els: ActiveElement[]) => { if (els.length) this.setPayBucket(els[0].index); },
        plugins: { legend: { display: false }, tooltip },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    } : null);
  }

  private breakdownBy(g: GroupBy): BreakdownRow[] {
    const saved = this.groupBy;
    this.groupBy = g;
    this.computeBreakdown();
    const out = this.breakdown;
    this.groupBy = saved;
    this.computeBreakdown();
    return out;
  }

  /* ── Helpers ───────────────────────────────────────────────────────── */

  private blankRow(key: string, id: string, name: string): InsightRow {
    return {
      key, employeeId: id || '', employeeCode: '', employeeName: name || '—', departmentName: '', designationName: '',
      hasSalary: false, monthlyCtc: 0, gross: 0, net: 0, paidDays: null,
      hasAttendance: false, daysWorked: 0, absentDays: 0, leaveDays: 0, lateIns: 0, earlyOuts: 0, hoursWorked: 0, overtimeHours: 0, attendancePct: null,
      hasProgress: false, totalTasks: 0, completedTasks: 0, overdueTasks: 0, taskCompletionRate: null, onTimeRate: null, kpiRate: null, score: null, band: '',
      projects: [],
    };
  }

  private countBy<T>(items: T[], keyFn: (t: T) => string): [string, number][] {
    const m = new Map<string, number>();
    items.forEach((i) => m.set(keyFn(i), (m.get(keyFn(i)) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }

  isDone(status: string | undefined): boolean {
    const s = (status || '').toLowerCase();
    return s.includes('complete') || s.includes('done') || s.includes('closed') || s.includes('approved');
  }

  private round1(v: number | null | undefined): number | null {
    return v == null || isNaN(Number(v)) ? null : Math.round(Number(v) * 10) / 10;
  }

  private monthRange(): { fromDate: string; toDate: string; monthEnd: string } {
    const m = MONTHS.indexOf(this.selectedMonth);
    const y = Number(this.selectedYear);
    const pad = (n: number) => String(n).padStart(2, '0');
    const last = new Date(y, m + 1, 0);
    const today = new Date();
    const end = last > today ? today : last;
    return {
      fromDate: `${y}-${pad(m + 1)}-01`,
      toDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
      monthEnd: `${y}-${pad(m + 1)}-${pad(last.getDate())}T23:59:59`,
    };
  }

  private sortedPeriods(): SalaryPeriod[] {
    return [...this.periods].sort((a, b) => Number(b.salaryYear) - Number(a.salaryYear) || MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month));
  }

  private hasPeriod(month: string, year: string): boolean {
    return this.periods.some((p) => p.month === month && p.salaryYear === year);
  }

  isProcessedPeriod(month: string): boolean {
    return this.hasPeriod(month, this.selectedYear);
  }

  private buildYears(): void {
    const now = new Date().getFullYear();
    const set = new Set<string>([String(now), String(now - 1), String(now - 2), ...this.periods.map((p) => p.salaryYear)]);
    if (this.selectedYear) set.add(this.selectedYear);
    this.years = Array.from(set).sort((a, b) => Number(b) - Number(a));
  }

  private hexA(color: string, alpha: number): string {
    const c = color.trim();
    if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
      const full = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
      const n = parseInt(full.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
    }
    return c;
  }

  /** Compact Indian-style amount: 1.2K / 3.4L / 1.1Cr. */
  short(v: number): string {
    const n = Math.abs(v || 0);
    const sign = v < 0 ? '-' : '';
    if (n >= 1e7) return `${sign}${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
    if (n >= 1e5) return `${sign}${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`;
    if (n >= 1e3) return `${sign}${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
    return `${sign}${Math.round(n)}`;
  }

  money(v: number): string {
    const n = Math.round(v || 0);
    return `${n < 0 ? '-' : ''}${this.currency}${Math.abs(n).toLocaleString('en-IN')}`;
  }

  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
  }

  pctClass(v: number | null, good = 90, ok = 75): string {
    if (v == null) return 'muted';
    return v >= good ? 'good' : v >= ok ? 'ok' : 'bad';
  }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  get userFirstName(): string {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || '{}');
      return (u.firstName || u.employeeFirstName || u.employeeName || '').split(' ')[0] || '';
    } catch {
      return '';
    }
  }

  get selectedBranchName(): string {
    return this.branches.find((b) => b.id === this.selectedBranchId)?.companyBranchName || 'All branches';
  }

  trackRow = (_: number, r: InsightRow) => r.key;
}
