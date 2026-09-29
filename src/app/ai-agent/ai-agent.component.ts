import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  AiAgentService, ChatHistoryMessage, AgentChatResponse,
  AttendanceRow, AttendanceUploadRequest,
  TdsRow, TdsUploadRequest
} from '../shared/services/ai-agent.service';
import * as XLSX from 'xlsx';

interface SalaryPendingAction {
  uploadedCount: number;
  skippedCodes: string[];
  month: string;
  year: string;
  branchId: string;
}

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  intent?: string;
  salaryPending?: SalaryPendingAction;
  timestamp: Date;
  loading?: boolean;
}

// Column header mapping for friendlier display names in tables
const FRIENDLY_KEYS: Record<string, string> = {
  employeeCode: 'Emp Code',
  employeeFirstName: 'First Name',
  employeeLastName: 'Last Name',
  departmentName: 'Department',
  designationName: 'Designation',
  presentDays: 'Present',
  workingDays: 'Working Days',
  totalDaysPayable: 'Payable Days',
  monthlySalaryNetAmount: 'Net Salary',
  monthlySalaryAmount: 'Gross',
  monthlySalaryDeduction: 'Deductions',
};

@Component({
  selector: 'app-ai-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './ai-agent.component.html',
  styleUrls: ['./ai-agent.component.scss'],
})
export class AiAgentComponent implements AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isOpen = false;
  userInput = '';
  messages: DisplayMessage[] = [];
  isLoading = false;
  history: ChatHistoryMessage[] = [];

  // File attach state
  selectedFile: File | null = null;
  parsedAttendanceRows: AttendanceRow[] = [];
  parsedTdsRows: TdsRow[] = [];
  detectedMonth = '';
  detectedYear = '';
  fileType: 'attendance' | 'tds' | 'unknown' = 'unknown';

  get inputPlaceholder(): string {
    if (this.fileType === 'tds')        return 'Type "Upload TDS" aur send karein...';
    if (this.selectedFile)              return 'Month/year likhein aur send karein...';
    return 'Fovestta se kuch bhi poochein...';
  }

  private branchId: string | undefined;
  private shouldScroll = false;

  constructor(private agentService: AiAgentService) {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      this.branchId = user?.branchID ?? user?.BranchID ?? user?.branchId ?? undefined;
    } catch {}
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.messages.push({
        role: 'assistant',
        content:
          'Namaste! Main Fovestta AI hun — aapka smart HRMS assistant. 🚀\n\nMain yeh sab kar sakta hun:\n• Salary · PF · ESI · TDS · Loan · Bonus reports\n• Attendance upload & salary processing\n• Employee list, profile & org chart\n• Master data: department, designation, employee add\n• TDS template download & upload\n\nExample: "April 2026 ki salary report do" ya "Add new employee"',
        timestamp: new Date(),
      });
    }
  }

  // ── File Attach ────────────────────────────────────────────────────────────

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.parsedAttendanceRows = [];
    this.detectedMonth = '';
    this.detectedYear = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: 0 });

        if (json.length === 0) {
          this.addBotMsg('⚠️ Excel file is empty or could not be read.');
          this.clearFile();
          return;
        }

        const cols = Object.keys(json[0]).map(k => k.toLowerCase());
        const isTds = cols.some(c => c.includes('tds') || c.includes('regime'));

        if (isTds) {
          // TDS file: Employee Code, Employee Name, TDS Amount, Regime
          this.fileType = 'tds';
          this.parsedTdsRows = json.map(row => ({
            employeeCode: String(row['Employee Code'] ?? row['employee code'] ?? row['EmployeeCode'] ?? '').trim().toUpperCase(),
            tdsAmount   : Number(row['TDS Amount']    ?? row['tds amount']    ?? row['TdsAmount']    ?? 0),
            regime      : String(row['Regime']         ?? row['regime']        ?? row['TdsRegime']    ?? 'New').trim(),
          })).filter(r => r.employeeCode);

          this.addBotMsg(
            `📎 "${file.name}" attached — ${this.parsedTdsRows.length} TDS records found.\n\n` +
            `"Update TDS" ya "Upload TDS" likhein aur send karein.`
          );
        } else {
          // Attendance file
          this.fileType = 'attendance';
          this.autoDetectMonthYear(file.name, json[0]);
          this.parsedAttendanceRows = json.map(row => this.mapAttendanceRow(row));

          this.addBotMsg(
            `📎 "${file.name}" attached — ${json.length} rows found.\n` +
            (this.detectedMonth ? `Month: ${this.detectedMonth} ${this.detectedYear}\n` : '') +
            `\nMessage mein month/year likhein aur send karein (e.g. "March 2026 ka attendance upload karo")`
          );
        }
      } catch {
        this.addBotMsg('⚠️ Could not parse Excel file. Please check the format.');
        this.clearFile();
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset so same file can be re-selected
    input.value = '';
  }

  clearFile() {
    this.selectedFile = null;
    this.parsedAttendanceRows = [];
    this.parsedTdsRows = [];
    this.fileType = 'unknown';
    this.detectedMonth = '';
    this.detectedYear = '';
  }

  // ── Send Message ───────────────────────────────────────────────────────────

  sendMessage() {
    const text = this.userInput.trim();
    if ((!text && !this.selectedFile) || this.isLoading) return;

    const displayText = text || `Upload file "${this.selectedFile?.name}"`;
    this.messages.push({ role: 'user', content: displayText, timestamp: new Date() });
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    const loadingMsg: DisplayMessage = { role: 'assistant', content: '', timestamp: new Date(), loading: true };
    this.messages.push(loadingMsg);

    // TDS file upload
    if (this.selectedFile && this.fileType === 'tds' && this.parsedTdsRows.length > 0) {
      const req: TdsUploadRequest = { branchId: this.branchId, rows: this.parsedTdsRows };
      this.clearFile();
      this.agentService.uploadTds(req).subscribe({
        next: res => this.handleResponse(res, displayText),
        error: (err: any) => this.handleError(err),
      });
      return;
    }

    // Attendance file — upload-only or full salary process
    if (this.selectedFile && this.parsedAttendanceRows.length > 0) {
      const { month, year } = this.extractMonthYear(text);
      const req: AttendanceUploadRequest = {
        month: month || this.detectedMonth || new Date().toLocaleString('en', { month: 'long' }),
        year: year || this.detectedYear || String(new Date().getFullYear()),
        rows: this.parsedAttendanceRows,
      };

      // Route to full salary orchestration if message mentions salary/process
      const wantsSalary = /process|salary|create.*salary|salary.*creat|payroll/i.test(text);
      this.clearFile();

      const obs$ = wantsSalary
        ? this.agentService.processSalary({ ...req, branchId: this.branchId })
        : this.agentService.uploadAttendance(req);

      obs$.subscribe({
        next: res => this.handleResponse(res, displayText),
        error: (err: any) => this.handleError(err),
      });
    } else {
      // No file — check if user wants to process salary (no Excel needed, uses existing attendance)
      const wantsSalaryNoFile = /process.*salary|salary.*process|run.*payroll|payroll.*run|create.*salary/i.test(text);
      if (wantsSalaryNoFile) {
        const { month, year } = this.extractMonthYear(text);
        this.agentService.processSalary({
          month: month || new Date().toLocaleString('en', { month: 'long' }),
          year: year || String(new Date().getFullYear()),
          rows: [],        // no attendance to upload
          branchId: this.branchId,
        }).subscribe({
          next: res => this.handleResponse(res, text),
          error: (err: any) => this.handleError(err),
        });
      } else {
        this.agentService.chat({ message: text, history: this.history, branchId: this.branchId }).subscribe({
          next: res => this.handleResponse(res, text),
          error: (err: any) => this.handleError(err),
        });
      }
    }
  }

  private handleResponse(res: AgentChatResponse, userText: string) {
    this.messages = this.messages.filter(m => !m.loading);
    this.isLoading = false;

    const content = res.clarificationNeeded
      ? res.clarificationQuestion ?? 'Kuch aur information chahiye.'
      : res.humanResponse || (res.error ?? 'Koi data nahi mila.');

    // Detect pending salary action (skipped records during attendance upload)
    const pending = res.data?.pendingSalaryProcess
      ? {
          uploadedCount : res.data.uploadedCount,
          skippedCodes  : res.data.skippedCodes ?? [],
          month         : res.data.month,
          year          : res.data.year,
          branchId      : res.data.branchId,
        } as SalaryPendingAction
      : undefined;

    // Auto-download TDS template when intent is get_tds_template
    if (res.intent === 'get_tds_template' && Array.isArray(res.data) && res.data.length > 0) {
      this.downloadTdsTemplate(res.data);
    }

    this.messages.push({
      role: 'assistant', content,
      data: pending ? undefined : (res.intent === 'get_tds_template' ? undefined : res.data),
      intent: res.intent,
      salaryPending: pending,
      timestamp: new Date(),
    });

    this.history.push({ role: 'user', content: userText });
    this.history.push({ role: 'assistant', content });
    if (this.history.length > 12) this.history = this.history.slice(-12);

    this.shouldScroll = true;
  }

  private handleError(err?: any) {
    this.messages = this.messages.filter(m => !m.loading);
    this.isLoading = false;

    let detail = '';
    try {
      if (err?.error?.error)        detail = err.error.error;
      else if (err?.error?.message) detail = err.error.message;
      else if (err?.message)        detail = err.message;
      else if (err?.status)         detail = `HTTP ${err.status}`;
    } catch {}

    const content = detail
      ? `❌ Error: ${detail}`
      : 'Sorry, kuch error aa gayi. Thodi der baad try karein.';

    this.messages.push({ role: 'assistant', content, timestamp: new Date() });
    this.shouldScroll = true;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Table Helpers ──────────────────────────────────────────────────────────

  hasTableData(data: any): boolean {
    return Array.isArray(data) && data.length > 0 && !this.isProfileCard(data);
  }

  isProfileCard(data: any): boolean {
    // Show as profile card when a single employee record is returned
    return Array.isArray(data) && data.length === 1 &&
      (data[0]?.employeeBasicDetail != null || data[0]?.employeeCode != null);
  }

  getProfileFields(data: any[]): Array<{label: string; value: string}> {
    if (!data?.length) return [];
    const item = data[0];
    const b = item.employeeBasicDetail ?? item;
    const contacts = b.employeeContactDetails?.[0] ?? {};
    const bank = b.employeeBankDetails?.[0] ?? {};
    const statutory = b.employeeStatutoryIdentityNos?.[0] ?? {};

    const fields = [
      { label: 'Employee Code', value: b.employeeCode },
      { label: 'Name', value: `${b.employeeFirstName ?? ''} ${b.employeeMiddleName ?? ''} ${b.employeeLastName ?? ''}`.replace(/\s+/g,' ').trim() },
      { label: 'Designation', value: b.designationName },
      { label: 'Department', value: b.departmentName },
      { label: 'Manager', value: b.managerName },
      { label: 'Branch', value: b.companyBranchName },
      { label: 'Date of Joining', value: b.dateOfJoining ? String(b.dateOfJoining).slice(0,10) : null },
      { label: 'Date of Birth', value: item.employeeDob },
      { label: 'Email', value: contacts.email },
      { label: 'Mobile', value: contacts.primaryMobileNo },
      { label: 'Work Phone', value: contacts.workPhoneNo },
      { label: 'PAN', value: b.panNo ?? statutory.employeePanno },
      { label: 'PF No', value: statutory.employeePfno },
      { label: 'UAN No', value: statutory.employeeUanno },
      { label: 'ESI No', value: statutory.employeeEsino },
      { label: 'Bank', value: bank.bankName },
      { label: 'Account No', value: bank.accountNumber },
      { label: 'IFSC', value: bank.ifsccode },
      { label: 'Status', value: b.status === 1 ? 'Active' : b.status === 0 ? 'Inactive' : null },
    ];
    return fields.filter(f => f.value != null && f.value !== '');
  }

  getTableKeys(data: any[]): string[] {
    if (!data?.length) return [];
    const first = data[0];

    // For EmployeePersonalDetailFieldDto — surface useful fields from nested employeeBasicDetail
    if (first?.employeeBasicDetail) {
      const b = first.employeeBasicDetail;
      return ['employeeCode', 'designationName', 'departmentName', 'dateOfJoining', 'status']
        .filter(k => b[k] !== undefined && b[k] !== null);
    }

    return Object.keys(first).filter(k => {
      const v = first[k];
      return typeof v !== 'object' && !k.toLowerCase().endsWith('id');
    }).slice(0, 7);
  }

  getCellValueForKey(row: unknown, key: string): string {
    const r = row as Record<string, any>;
    // For employee profile rows, look inside employeeBasicDetail
    const src = r['employeeBasicDetail'] ? r['employeeBasicDetail'] : r;
    return this.getCellValue(src, key);
  }

  getTableHeader(key: string): string {
    return FRIENDLY_KEYS[key] ?? key.replace(/([A-Z])/g, ' $1').trim();
  }

  getCellValue(row: unknown, key: string): string {
    const r = row as Record<string, unknown>;
    const v = r[key];
    if (v == null) return '—';
    if (typeof v === 'number') return v.toLocaleString('en-IN');
    return String(v);
  }

  getEmployeeName(row: unknown): string {
    const r = row as Record<string, any>;
    // From EmployeePersonalDetailFieldDto: nested employeeBasicDetail
    const d = r['employeeBasicDetail'] ?? r;
    const first = d['employeeFirstName'] ?? '';
    const last = d['employeeLastName'] ?? '';
    return `${first} ${last}`.trim();
  }

  // Called when user clicks "Continue with X employees" after skipped records
  continueSalaryProcessing(pending: SalaryPendingAction) {
    if (this.isLoading) return;

    this.messages.push({
      role: 'user',
      content: `Continue with ${pending.uploadedCount} employees (skip ${pending.skippedCodes.length} unmatched)`,
      timestamp: new Date(),
    });
    this.isLoading = true;
    this.shouldScroll = true;
    this.messages.push({ role: 'assistant', content: '', timestamp: new Date(), loading: true });

    // Call process-salary with empty rows — attendance already uploaded, just run salary
    this.agentService.processSalary({
      month: pending.month,
      year: pending.year,
      rows: [],
      branchId: pending.branchId,
    }).subscribe({
      next: res => this.handleResponse(res, `process salary ${pending.month} ${pending.year}`),
      error: () => this.handleError(),
    });
  }

  // Called when user wants to correct and re-upload
  requestCorrection(pending: SalaryPendingAction) {
    const codes = pending.skippedCodes.join(', ');
    this.addBotMsg(
      `📝 Please fix these employee codes in your Excel and re-attach:\n${pending.skippedCodes.map(c => `  • ${c}`).join('\n')}\n\nCorrect karke dobara Excel attach karein aur message bhejein.`
    );
  }

  clearChat() {
    this.messages = [];
    this.history = [];
    this.clearFile();
  }

  // ── TDS Template Download (same as "Download Template" button on TDS page) ──

  private downloadTdsTemplate(data: any[]): void {
    const wsData: any[][] = [['Employee Code', 'Employee Name', 'TDS Amount', 'Regime']];
    for (const row of data) {
      wsData.push([
        row['Employee Code'] ?? row['employeeCode'] ?? 'N/A',
        row['Employee Name'] ?? row['employeeName'] ?? row['name'] ?? 'Unknown',
        row['TDS Amount']    ?? row['tdsAmount']    ?? 0,
        row['Regime']        ?? row['regime']        ?? 'N/A',
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee_TDS_Data');
    XLSX.writeFile(wb, 'Employee_TDS_Template.xlsx');
  }

  // ── Excel Export ───────────────────────────────────────────────────────────

  exportToExcel(data: any[], intent?: string): void {
    if (!data?.length) return;
    const i = (intent ?? '').toLowerCase();
    if      (i.includes('salary'))     this.exportSalaryReport(data);
    else if (i.includes('loan'))       this.exportLoanReport(data);
    else if (i.includes('pf'))         this.exportPfReport(data);
    else if (i.includes('esi'))        this.exportEsiReport(data);
    else if (i.includes('bonus'))      this.exportBonusReport(data);
    else if (i.includes('employee') || i.includes('manager') || i.includes('reportee'))
                                       this.exportEmployeeReport(data);
    else if (i.includes('attendance')) this.exportAttendanceReport(data);
    else                               this.exportGenericReport(data, intent ?? 'Report');
  }

  // Salary Report — matches the existing salary report format exactly
  private exportSalaryReport(data: any[]): void {
    const earningHeads: string[] = [];
    const deductionHeads: string[] = [];
    const earningSet = new Set<string>();
    const deductionSet = new Set<string>();

    for (const emp of data) {
      for (const detail of (emp.salaryDetailFieldDtos ?? [])) {
        const name: string = detail.payHead?.payHeadDisplayName ?? '';
        const type: string = (detail.payHead?.payHeadType ?? '').trim();
        if (!name) continue;
        if (type === 'Deduction' || type === 'Deductions') {
          if (!deductionSet.has(name)) { deductionSet.add(name); deductionHeads.push(name); }
        } else {
          if (!earningSet.has(name)) { earningSet.add(name); earningHeads.push(name); }
        }
      }
    }

    const first = data[0];
    const monthYear = `${first?.month ?? ''} ${first?.salaryYear ?? ''}`.trim() || 'Export';
    const rows: any[][] = [['Salary Report'], [`Salary Month/Year: ${monthYear}`], []];

    const headers = [
      'S.No', 'Emp Code', 'Employee Name',
      'Present Days', 'Working Days', 'Total Payable Days',
      ...earningHeads.map(h => `${h} (Actual)`),
      'Total Earnings (Actual)',
      ...earningHeads, 'Total Earnings',
      ...deductionHeads, 'Total Deductions', 'Net Salary',
    ];
    rows.push(headers);

    let sno = 1;
    const totals: Record<string, number> = {};
    headers.forEach(h => (totals[h] = 0));

    for (const emp of data) {
      const basic = emp.employeeBasicDetail ?? {};
      const att = emp.employeeAttendance ?? {};
      const name = `${basic.employeeFirstName ?? ''} ${basic.employeeLastName ?? ''}`.trim();

      const amountMap: Record<string, number> = {};
      const actualMap: Record<string, number> = {};
      for (const d of (emp.salaryDetailFieldDtos ?? [])) {
        const n: string = d.payHead?.payHeadDisplayName ?? '';
        if (!n) continue;
        amountMap[n] = Number(d.amount ?? 0);
        actualMap[n] = Number(
          d.employeeCtcDetail?.value || d.monthlyAmount || d.monthlySalary ||
          d.actualAmount || d.rate || d.ctcValue || d.monthlyRate ||
          d.payHead?.payHeadValue || 0
        );
      }

      const presentDays = att.presentDays ?? 0;
      const workingDays = att.workingDays ?? 0;
      const payableDays = att.totalDaysPayable ?? 0;
      const totalEarnings = emp.monthlySalaryAmount ?? 0;
      const totalEarningsActual = earningHeads.reduce((s, h) => s + (actualMap[h] ?? 0), 0);
      const totalDeductions = emp.monthlySalaryDeduction ?? 0;
      const netSalary = emp.monthlySalaryNetAmount ?? 0;

      rows.push([
        sno++, basic.employeeCode ?? '', name,
        presentDays, workingDays, payableDays,
        ...earningHeads.map(h => actualMap[h] ?? 0),
        totalEarningsActual,
        ...earningHeads.map(h => amountMap[h] ?? 0),
        totalEarnings,
        ...deductionHeads.map(h => amountMap[h] ?? 0),
        totalDeductions, netSalary,
      ]);

      totals['Present Days'] += presentDays;
      totals['Working Days'] += workingDays;
      totals['Total Payable Days'] += payableDays;
      earningHeads.forEach(h => {
        totals[`${h} (Actual)`] = (totals[`${h} (Actual)`] ?? 0) + (actualMap[h] ?? 0);
        totals[h] = (totals[h] ?? 0) + (amountMap[h] ?? 0);
      });
      totals['Total Earnings (Actual)'] = (totals['Total Earnings (Actual)'] ?? 0) + totalEarningsActual;
      totals['Total Earnings'] += totalEarnings;
      deductionHeads.forEach(h => (totals[h] = (totals[h] ?? 0) + (amountMap[h] ?? 0)));
      totals['Total Deductions'] += totalDeductions;
      totals['Net Salary'] += netSalary;
    }

    rows.push(headers.map((h, i) => i < 2 ? '' : i === 2 ? 'Total' : (totals[h] ?? 0)));

    this.writeExcel(rows, 'Salary Report', headers, `Salary_Report_${monthYear.replace(/[\s\/\-]/g, '_')}.xlsx`);
  }

  // ── Loan Report — matches loan-management.component.ts exactly ────────────
  private exportLoanReport(data: any[]): void {
    // Extract month/year from dueDate field
    const rawDate = this.v(data[0], 'dueDate', 'DueDate');
    const d = rawDate ? new Date(rawDate) : null;
    const month = d ? d.toLocaleString('en', { month: 'long' }) : '';
    const year  = d ? String(d.getFullYear()) : '';
    const tag   = month && year ? `${month}_${year}` : new Date().toISOString().slice(0, 7);

    const rows = data.map((item, i) => ({
      'Sr No.'                 : i + 1,
      'Employee Code'          : this.v(item, 'employeeCode', 'EmployeeCode') ?? '',
      'Employee Name'          : this.v(item, 'employeeName', 'EmployeeName') ?? '',
      'Loan Name'              : this.v(item, 'loanName', 'LoanName') ?? '',
      'Opening Balance'        : this.n(item, 'openingBalance', 'OpeningBalance'),
      'Closing Balance'        : this.n(item, 'closingBalance', 'ClosingBalance'),
      'Due Date'               : this.v(item, 'dueDate', 'DueDate') ?? '',
      'Installment Amount Due' : this.n(item, 'installmentAmountDue', 'InstallmentAmountDue'),
      'Mode Of Payment'        : this.v(item, 'modeOfPayment', 'ModeOfPayment') ?? '',
      'Recovered Amount'       : this.n(item, 'recoverdAmount', 'RecoverdAmount'),
      'Remarks'                : this.v(item, 'remarks', 'Remarks') ?? '',
      'Status'                 : this.v(item, 'loanStatus', 'LoanStatus') ?? '',
    }));

    rows.push({
      'Sr No.'                 : '' as any,
      'Employee Code'          : '',
      'Employee Name'          : 'Total',
      'Loan Name'              : '',
      'Opening Balance'        : data.reduce((s,r) => s + this.n(r,'openingBalance','OpeningBalance'), 0),
      'Closing Balance'        : data.reduce((s,r) => s + this.n(r,'closingBalance','ClosingBalance'), 0),
      'Due Date'               : '',
      'Installment Amount Due' : data.reduce((s,r) => s + this.n(r,'installmentAmountDue','InstallmentAmountDue'), 0),
      'Mode Of Payment'        : '',
      'Recovered Amount'       : data.reduce((s,r) => s + this.n(r,'recoverdAmount','RecoverdAmount'), 0),
      'Remarks'                : '',
      'Status'                 : '',
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loan Data');
    ws['!cols'] = [6,14,25,20,16,16,14,20,16,16,20,12].map(wch => ({ wch }));
    XLSX.writeFile(wb, `Loan_Report_${tag}.xlsx`);
  }

  // ── PF Report — matches pf-report.component.ts exactly ───────────────────
  private exportPfReport(data: any[]): void {
    const first = data[0];
    const month = this.v(first, 'salaryMonth') ?? '';
    const year  = this.v(first, 'salaryYear')  ?? '';
    const tag   = month && year ? `${month}_${year}` : new Date().toISOString().slice(0, 7);

    const rows = data.map((e, i) => ({
      'Sr No'                  : i + 1,
      'Employee Code'          : this.v(e,'employeeCode','EmployeeCode') ?? '',
      'Employee Name'          : this.v(e,'employeeName','EmployeeName') ?? '',
      'Branch'                 : this.v(e,'branchName') ?? '',
      'Department'             : this.v(e,'departmentName') ?? '',
      'Designation'            : this.v(e,'designationName') ?? '',
      'PF Number'              : this.v(e,'pf','pfNumber','pfNo') ?? '',
      'UAN'                    : this.v(e,'uan','uanNo') ?? '',
      'PAN'                    : this.v(e,'pan','panNo') ?? '',
      'Month-Year'             : month && year ? `${month}-${year}` : '',
      'Basic Salary'           : this.n(e,'basic_Amount','basicAmount','basic'),
      'Employee Contribution'  : this.n(e,'pF_EE_Amount','pfEeAmount','employeePf'),
      'EPS'                    : this.n(e,'epS_Amount','epsAmount','eps'),
      'VPF'                    : this.n(e,'vpF_Amount','vpfAmount','vpf'),
      'Employer Contribution'  : this.n(e,'pF_ER_Amount','pfErAmount','employerPf'),
      'Admin Charges'          : this.n(e,'pF_Admin','pfAdmin','adminCharges'),
      'EDLI Charges'           : this.n(e,'edlI_Amount','edliAmount','edli'),
      'Total PF Contribution'  : this.n(e,'totalPFContribution','totalPf'),
    }));

    const numCols: Array<keyof typeof rows[0]> = [
      'Basic Salary','Employee Contribution','EPS','VPF',
      'Employer Contribution','Admin Charges','EDLI Charges','Total PF Contribution'
    ];
    const totals: any = { 'Sr No': '', 'Employee Code': '', 'Employee Name': 'Total',
      Branch:'', Department:'', Designation:'', 'PF Number':'', UAN:'', PAN:'', 'Month-Year':'' };
    numCols.forEach(c => totals[c] = rows.reduce((s, r) => s + (Number(r[c]) || 0), 0));
    rows.push(totals);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PF Report');
    ws['!cols'] = [6,12,20,15,15,15,14,12,12,12,14,16,12,10,16,14,14,18].map(wch => ({ wch }));
    XLSX.writeFile(wb, `PF_Report_${tag}.xlsx`);
  }

  // ── ESI Report — matches esi-report.component.ts exactly ─────────────────
  private exportEsiReport(data: any[]): void {
    const first = data[0];
    const month = this.v(first, 'salaryMonth') ?? '';
    const year  = this.v(first, 'salaryYear')  ?? '';
    const tag   = month && year ? `${month}_${year}` : new Date().toISOString().slice(0, 7);

    const rows = data.map((e, i) => ({
      'Sr No'                  : i + 1,
      'Employee Code'          : this.v(e,'employeeCode','EmployeeCode') ?? '',
      'Employee Name'          : this.v(e,'employeeName','EmployeeName') ?? '',
      'Branch'                 : this.v(e,'branchName') ?? '',
      'Department'             : this.v(e,'departmentName') ?? '',
      'Designation'            : this.v(e,'designationName') ?? '',
      'ESI Number'             : this.v(e,'esi','esiNumber','esiNo') ?? '',
      'PAN'                    : this.v(e,'pan','panNo') ?? '',
      'Month-Year'             : month && year ? `${month}-${year}` : '',
      'Monthly Salary'         : this.n(e,'monthlySalaryAmount','monthlySalary'),
      'Employee Contribution'  : this.n(e,'esI_EE','esiEe','employeeEsi'),
      'Employer Contribution'  : this.n(e,'esI_ER','esiEr','employerEsi'),
      'Total ESI Contribution' : this.n(e,'totalESIContribution','totalEsi'),
    }));

    const numCols: Array<keyof typeof rows[0]> = [
      'Monthly Salary','Employee Contribution','Employer Contribution','Total ESI Contribution'
    ];
    const totals: any = { 'Sr No': '', 'Employee Code': '', 'Employee Name': 'Total',
      Branch:'', Department:'', Designation:'', 'ESI Number':'', PAN:'', 'Month-Year':'' };
    numCols.forEach(c => totals[c] = rows.reduce((s, r) => s + (Number(r[c]) || 0), 0));
    rows.push(totals);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ESI Report');
    ws['!cols'] = [6,12,20,15,15,15,14,12,12,16,18,18,20].map(wch => ({ wch }));
    XLSX.writeFile(wb, `ESI_Report_${tag}.xlsx`);
  }

  // ── Bonus Report ──────────────────────────────────────────────────────────
  private exportBonusReport(data: any[]): void {
    const rows = data.map((e, i) => ({
      'Sr No'         : i + 1,
      'Employee Code' : this.v(e,'employeeCode','EmployeeCode') ?? '',
      'Employee Name' : this.v(e,'employeeName','EmployeeName') ?? '',
      'Department'    : this.v(e,'departmentName') ?? '',
      'Designation'   : this.v(e,'designationName') ?? '',
      'Bonus Type'    : this.v(e,'bonusType','bonusName') ?? '',
      'Bonus Amount'  : this.n(e,'bonusAmount','amount'),
      'Month'         : this.v(e,'month','salaryMonth') ?? '',
      'Year'          : this.v(e,'year','salaryYear') ?? '',
      'Remarks'       : this.v(e,'remarks','Remarks') ?? '',
    }));
    rows.push({ 'Sr No': '' as any, 'Employee Code':'', 'Employee Name':'Total',
      Department:'', Designation:'', 'Bonus Type':'',
      'Bonus Amount': data.reduce((s,r) => s + this.n(r,'bonusAmount','amount'), 0),
      Month:'', Year:'', Remarks:'' });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bonus Report');
    ws['!cols'] = [6,12,22,16,16,18,16,10,8,20].map(wch => ({ wch }));
    const tag = `${this.v(data[0],'month','salaryMonth') ?? ''}_${this.v(data[0],'year','salaryYear') ?? ''}`.replace(/^_|_$/g,'') || new Date().toISOString().slice(0,7);
    XLSX.writeFile(wb, `Bonus_Report_${tag}.xlsx`);
  }

  // ── Attendance Report ─────────────────────────────────────────────────────
  private exportAttendanceReport(data: any[]): void {
    const rows = data.map((e, i) => ({
      'Sr No'          : i + 1,
      'Employee Code'  : this.v(e,'employeeCode','EmployeeCode') ?? '',
      'Employee Name'  : this.v(e,'employeeName','EmployeeName') ?? '',
      'Month'          : this.v(e,'attendanceMonth','month') ?? '',
      'Year'           : this.v(e,'attendanceYear','year') ?? '',
      'Present Days'   : this.n(e,'presentDays'),
      'Working Days'   : this.n(e,'workingDays'),
      'Absent Days'    : this.n(e,'absentDays'),
      'Week Off'       : this.n(e,'weekOffDays'),
      'Holidays'       : this.n(e,'holidays'),
      'Leaves Availed' : this.n(e,'leavesAvailed'),
      'Payable Days'   : this.n(e,'totalDaysPayable'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    ws['!cols'] = [6,12,22,10,8,12,12,12,10,10,14,12].map(wch => ({ wch }));
    XLSX.writeFile(wb, `Attendance_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  private exportEmployeeReport(data: any[]) {
    const headers = [
      'S.No', 'Emp Code', 'Employee Name', 'Department', 'Designation',
      'Manager', 'Branch', 'Date of Joining', 'Email', 'Personal Email',
      'Mobile', 'Work Phone', 'PAN', 'PF No', 'UAN No', 'ESI No',
      'Bank Name', 'Account No', 'IFSC', 'Status',
    ];
    const rows: any[][] = [headers];
    let sno = 1;

    for (const item of data) {
      // EmployeePersonalDetailFieldDto: top-level has dob/gender/blood group,
      // nested employeeBasicDetail has names/code/designation/department/contacts/bank
      const b = item.employeeBasicDetail ?? item;
      const contacts: any = b.employeeContactDetails?.[0] ?? {};
      const bank: any = b.employeeBankDetails?.[0] ?? {};
      const statutory: any = b.employeeStatutoryIdentityNos?.[0] ?? {};

      rows.push([
        sno++,
        b.employeeCode ?? '',
        `${b.employeeFirstName ?? ''} ${b.employeeMiddleName ?? ''} ${b.employeeLastName ?? ''}`.replace(/\s+/g, ' ').trim(),
        b.departmentName ?? '',
        b.designationName ?? '',
        b.managerName ?? '',
        b.companyBranchName ?? '',
        b.dateOfJoining ? String(b.dateOfJoining).slice(0, 10) : '',
        contacts.email ?? '',
        contacts.personalEmailId ?? '',
        contacts.primaryMobileNo ?? '',
        contacts.workPhoneNo ?? '',
        b.panNo ?? statutory.employeePanno ?? '',
        statutory.employeePfno ?? '',
        statutory.employeeUanno ?? '',
        statutory.employeeEsino ?? '',
        bank.bankName ?? '',
        bank.accountNumber ?? '',
        bank.ifsccode ?? '',
        b.status === 1 ? 'Active' : b.status === 0 ? 'Inactive' : '',
      ]);
    }

    this.writeExcel(rows, 'Employee List', headers, `Employee_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  private exportGenericReport(data: any[], label: string) {
    const flat = this.flattenRecord(data[0]);
    const keys = Object.keys(flat);
    const rows: any[][] = [['S.No', ...keys]];
    let sno = 1;
    for (const item of data) {
      const f = this.flattenRecord(item);
      rows.push([sno++, ...keys.map(k => f[k] ?? '')]);
    }
    this.writeExcel(rows, label, rows[0] as string[], `${label.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  private writeExcel(rows: any[][], sheetName: string, headers: string[], fileName: string) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    ws['!cols'] = headers.map(h =>
      ['Employee Name', 'Emp Code', 'Department', 'Designation'].includes(h) ? { wch: 28 } : { wch: 16 }
    );
    XLSX.writeFile(wb, fileName);
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  // Get first non-null value trying multiple key casings
  private v(obj: any, ...keys: string[]): string | null {
    for (const k of keys) {
      if (obj?.[k] != null && obj[k] !== '') return String(obj[k]);
    }
    return null;
  }

  // Get numeric value trying multiple key casings
  private n(obj: any, ...keys: string[]): number {
    for (const k of keys) {
      const val = obj?.[k];
      if (val != null) return Number(val) || 0;
    }
    return 0;
  }

  private flattenRecord(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj ?? {})) {
      const val = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(result, this.flattenRecord(val, fullKey));
      } else if (!Array.isArray(val)) {
        result[fullKey] = val;
      }
    }
    return result;
  }

  private nestedGet(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  private mapAttendanceRow(row: any): AttendanceRow {
    const find = (...keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk => rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase());
        if (found !== undefined && row[found] !== undefined) return Number(row[found]) || 0;
      }
      return 0;
    };
    const findStr = (...keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(row).find(rk => rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase());
        if (found !== undefined && row[found] !== undefined) return String(row[found]).trim();
      }
      return '';
    };
    return {
      employeeCode: findStr('employeecode', 'empcode', 'code', 'empid'),
      presentDays: find('presentdays', 'present', 'presentday'),
      workingDays: find('workingdays', 'working', 'workdays', 'totalworkingdays'),
      totalDaysPayable: find('totaldayspayable', 'payabledays', 'paydays', 'totalpayabledays'),
      absentDays: find('absentdays', 'absent'),
      weekOffDays: find('weekoffdays', 'weekoff', 'wo'),
      holidays: find('holidays', 'holiday'),
      leavesAvailed: find('leavesavailed', 'leaves', 'leave'),
      normalDayOvertime: find('normaldayovertime', 'overtime', 'ot'),
    };
  }

  private autoDetectMonthYear(filename: string, firstRow: any) {
    // Try from first row columns
    const monthNames = ['january','february','march','april','may','june',
      'july','august','september','october','november','december'];
    for (const key of Object.keys(firstRow)) {
      const val = String(firstRow[key]).toLowerCase();
      const found = monthNames.find(m => val.includes(m));
      if (found) {
        this.detectedMonth = found.charAt(0).toUpperCase() + found.slice(1);
        const yearMatch = val.match(/\d{4}/);
        if (yearMatch) this.detectedYear = yearMatch[0];
        return;
      }
    }
    // Try from filename
    const fnLower = filename.toLowerCase();
    const found = monthNames.find(m => fnLower.includes(m));
    if (found) this.detectedMonth = found.charAt(0).toUpperCase() + found.slice(1);
    const yearMatch = filename.match(/\d{4}/);
    if (yearMatch) this.detectedYear = yearMatch[0];
  }

  private extractMonthYear(text: string): { month: string; year: string } {
    const monthNames = ['january','february','march','april','may','june',
      'july','august','september','october','november','december'];
    const lower = text.toLowerCase();
    const month = monthNames.find(m => lower.includes(m)) ?? '';
    const yearMatch = text.match(/\b(20\d{2})\b/);
    return {
      month: month ? month.charAt(0).toUpperCase() + month.slice(1) : '',
      year: yearMatch?.[1] ?? '',
    };
  }

  private addBotMsg(content: string) {
    this.messages.push({ role: 'assistant', content, timestamp: new Date() });
    this.shouldScroll = true;
  }

  private scrollToBottom() {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}
