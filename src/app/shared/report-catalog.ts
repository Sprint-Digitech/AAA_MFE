// Single source of truth for how reports are grouped and described in the shell.
// Menus still come from HRMSAuthZ per role - this file only decides which section a granted
// report path lands in (sidebar flyout + Report Hub) and the one-line blurb shown in the hub.
// Register every new report here; an unknown path under the Reports menu falls into "Other".

export type ReportCategory =
  | 'Attendance'
  | 'Leave'
  | 'Payroll'
  | 'Statutory'
  | 'Tax'
  | 'Employee'
  | 'Other';

export const REPORT_CATEGORY_ORDER: ReportCategory[] = [
  'Payroll', 'Statutory', 'Tax', 'Attendance', 'Leave', 'Employee', 'Other',
];

export const REPORT_CATEGORY_ICON: Record<ReportCategory, string> = {
  Attendance: 'event_available',
  Leave: 'beach_access',
  Payroll: 'payments',
  Statutory: 'gavel',
  Tax: 'receipt_long',
  Employee: 'badge',
  Other: 'description',
};

export interface ReportCatalogEntry {
  category: ReportCategory;
  description: string;
}

// Keyed by lower-cased menu path without the leading slash.
export const REPORT_CATALOG: Record<string, ReportCatalogEntry> = {
  // Attendance
  'attendance/daily-attendance-report': { category: 'Attendance', description: 'Status, in/out punches and hours of every employee for one day.' },
  'attendance/monthly-attendance-report': { category: 'Attendance', description: 'Month grid of day-wise status with present, absent, leave and holiday totals.' },
  'attendance/employee-wise-monthly-attendance-report': { category: 'Attendance', description: 'One employee\'s month: punches, status and hours per day.' },
  'attendance/punctuality-report': { category: 'Attendance', description: 'Late-ins and early-outs per employee and per day, with minutes and weekday pattern.' },
  'attendance/shift-report': { category: 'Attendance', description: 'Shift assignment and timings across employees.' },
  'attendance/monthly-field-tracking-report': { category: 'Attendance', description: 'Field employees\' visits and location pings for the month.' },

  // Leave
  'attendance/leave-balance-report': { category: 'Leave', description: 'Entitled, accrued, availed, pending, encashed and available leave per employee for a leave year.' },
  'attendance/leave-ledger-report': { category: 'Leave', description: 'Every balance movement - accrual, applied, approved, lapsed, penalty - as a statement per employee.' },
  'attendance/leave-register-report': { category: 'Leave', description: 'Who is on leave, LOP days and pending approvals for any period, by type and department.' },

  // Payroll
  'salary/reportsalary': { category: 'Payroll', description: 'Pay register for a month in your company\'s chosen layout.' },
  'salary/gratuityliability': { category: 'Payroll', description: 'Gratuity provision accrued for everyone on the rolls, and what is payable today.' },
  'payroll/minimumwagescheck': { category: 'Statutory', description: 'Basic + DA vs state minimum wage for each employee\'s category; missing categories and rates.' },
  'salary/fullandfinal': { category: 'Payroll', description: 'Settlement worksheet for leavers: exit salary, leave encashment, gratuity, loans and notice recovery.' },
  'salary/salaryrevisions': { category: 'Payroll', description: 'Increments in a period - size, spread, by department - and who has not been revised.' },
  'salary/payrollcost': { category: 'Payroll', description: 'Pay head totals by department, branch, month or employee (YTD), plus a balanced journal voucher.' },
  'salary/banktransfer': { category: 'Payroll', description: 'Salary bulk-payment file in your bank\'s format, advice letter, and cash/cheque list.' },
  'salary/payrollanomalies': { category: 'Payroll', description: 'Pre-payroll check: missing CTC, attendance, bank, UAN/PAN and suspicious salaries, with fixes.' },
  'salary/payrollvariance': { category: 'Payroll', description: 'Month-on-month comparison - who changed, by how much and why. Check before freezing.' },
  'salary/salaryadvancereport': { category: 'Payroll', description: 'Salary advances given, recovered and outstanding.' },
  'loan/loanmanagement': { category: 'Payroll', description: 'Employee loans, EMIs and repayment status.' },
  'arrear/arrear-report': { category: 'Payroll', description: 'Arrears computed per employee and pay head.' },
  'bonus/bonus-report': { category: 'Payroll', description: 'Statutory / management bonus calculated and disbursed.' },
  'reimbursement/mis-report': { category: 'Payroll', description: 'Reimbursement claims by status, type and amount.' },

  // Statutory
  'payroll/pfreport': { category: 'Statutory', description: 'PF contributions with EPFO ECR file export.' },
  'payroll/esireport': { category: 'Statutory', description: 'ESI contributions and monthly contribution file.' },
  'payroll/esicoverage': { category: 'Statutory', description: 'Who should or should not pay ESI this month under contribution-period rules.' },
  'payroll/ptreport': { category: 'Statutory', description: 'Professional Tax by state and monthly rate - figures for state PT returns.' },
  'payroll/lwfreport': { category: 'Statutory', description: 'Labour Welfare Fund employee and employer shares by state.' },

  // Tax
  'tds/statutory-forms/form16-generation': { category: 'Tax', description: 'Generate Form 16 Part A/B for employees.' },
  'tds/statutory-forms/form24q-generation': { category: 'Tax', description: 'Quarterly TDS return (Form 24Q) data.' },

  // Employee
  'payroll/salaryreport': { category: 'Employee', description: 'Employee basic details - joining, department, designation, bank and IDs.' },
  'attendance/probation-report': { category: 'Employee', description: 'Probation ending soon, held past end date, and recently confirmed - who needs a decision.' },
  'employee/profilecompleteness': { category: 'Employee', description: 'Missing PAN, Aadhaar, bank, UAN, DOB, contacts, photo - per employee and per check.' },
  'employee/audittrail': { category: 'Employee', description: 'Who changed employee records (bank, statutory, personal, documents...) - field by field, old to new.' },
  'salary/audittrail': { category: 'Payroll', description: 'Who changed CTC, pay heads, loans, gratuity and payroll settings - field by field.' },
  'salary/reportschedules': { category: 'Payroll', description: 'Email payroll reports as Excel on a daily, weekly or monthly schedule (HR and Admin only).' },
  'employee/recruitmentanalytics': { category: 'Employee', description: 'Hiring funnel, time to hire, source effectiveness, offer acceptance and candidates past SLA.' },
  'employee/workforceanalytics': { category: 'Employee', description: 'Headcount trend, joiners vs exits, attrition, tenure/age/gender mix, birthdays and anniversaries.' },
  'payroll/manpowerreport': { category: 'Employee', description: 'Joiners, exits and headcount by branch, department and designation.' },
  'payroll/extensionreport': { category: 'Employee', description: 'Probation extensions and confirmation status.' },
  'employee/educationdetailreport': { category: 'Employee', description: 'Qualifications recorded for each employee.' },
  'employee/contactlistreport': { category: 'Employee', description: 'Phone, email and address directory.' },
  'employee/familydetailreport': { category: 'Employee', description: 'Family members and dependants.' },
  'employee/nomineedetailreport': { category: 'Employee', description: 'Nominees for PF, gratuity and insurance.' },
};

export interface ReportLink {
  name: string;
  path: string;
  category: ReportCategory;
  description: string;
}

export interface ReportGroup {
  category: ReportCategory;
  icon: string;
  reports: ReportLink[];
}

export function catalogKey(path: string): string {
  return (path || '').replace(/^\/+/, '').toLowerCase();
}

export function isReportsMenu(menu: any): boolean {
  return catalogKey(menu?.menuPath) === 'reports' || menu?.menuDisplayName === 'Reports';
}

/**
 * Every report the user is granted: all children of the Reports menu, plus any catalogued
 * report path that lives under another parent (e.g. Arrear > Report, TDS > Form 16).
 * De-duplicated by path; first menu name wins.
 */
export function collectReportLinks(menus: any[] | null | undefined): ReportLink[] {
  const byPath = new Map<string, ReportLink>();
  const add = (m: any, forceInclude: boolean) => {
    const key = catalogKey(m?.menuPath);
    if (!key || byPath.has(key)) return;
    const entry = REPORT_CATALOG[key];
    if (!entry && !forceInclude) return;
    byPath.set(key, {
      name: m.menuDisplayName || m.menuName || key,
      path: '/' + (m.menuPath || '').replace(/^\/+/, ''),
      category: entry?.category ?? 'Other',
      description: entry?.description ?? '',
    });
  };
  const walk = (items: any[] | null | undefined, underReports: boolean) => {
    (items || []).forEach((m) => {
      const children = m?.submenu;
      if (children?.length) {
        walk(children, underReports || isReportsMenu(m));
      } else {
        add(m, underReports);
      }
    });
  };
  walk(menus, false);
  return [...byPath.values()];
}

export function groupReportLinks(links: ReportLink[]): ReportGroup[] {
  return REPORT_CATEGORY_ORDER
    .map((category) => ({
      category,
      icon: REPORT_CATEGORY_ICON[category],
      reports: links.filter((l) => l.category === category).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.reports.length > 0);
}
