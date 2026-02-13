import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, forkJoin } from 'rxjs';
import { EmployeeEligibilityDto } from '../../../../src/app/_models/employeeEligibilityDto.model';
import { EligibilityCriteriaDto } from '../../../../src/app/_models/eligibilityCriteriaDto.model';
import { ApprovalRequestEligibilityDto } from '../../../../src/app/_models/approvalRequestEligibilityDto.model';
import { ApprovalResponseEligibilityDto } from '../../../../src/app/_models/approvalResponseEligibilityDto.model';


interface BonusEligibilityRequest {
  employeeEligibiltyDetailId: string;
  fixedSalary: number;
  totalWorkingDays: number;
  bonusRatePercentage: number;
  employeeId: string;
  bonusRuleId: string;
  utilityFinancialYearId: string;
  status: number;
}

interface BonusRule {
  bonusRuleId: string;
  companyBranchID: string;
}

interface UtilityFinancialYear {
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  modifiedBy: string;
  utilityFinancialYearId: string;
  financialYearStarts: string;
  financialYearEnds: string;
  status: number;
}

interface ParsedFinancialYear {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
}

interface BonusParameter {
  bonusParameterId: string;
  minimumBonusPercentage: number;
  maximumBonusPercentage: number;
  eligbiltyMaxSalaryLimit: number;
  bonusCalculationCelling: number;
  minimumWorkingDays: number;
  effectiveDate: string;
  status: number;
}

interface BonusEmployee {
  employeeEligibiltyDetailId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  totalAttendanceDays: number;
  fixedSalary: number;
  bonusRuleLimit: number;
  bonusRuleId: string;
  totalBonusCalculationValue?: number;
}
@Injectable({
  providedIn: 'root'
})
export class EmployeeEligibilityService {
  private baseUrl: string;
  environment = {
    production: false,
    urlAddress: 'https://localhost:7087',
  };
  constructor(
    private http: HttpClient,

  ) {
    this.baseUrl = this.environment.urlAddress;
  }

  private createCompleteRoute = (route: string): string => {
    return `${this.baseUrl}/${route}`;
  };

  getFinancialYears(): Observable<UtilityFinancialYear[]> {
    const url = this.createCompleteRoute('api/UtilityFinancialYear/UtilityFinancialYeartList');
    return this.http.get<UtilityFinancialYear[]>(url);
  }

  // Get bonus parameters list
  getBonusParameterList(): Observable<BonusParameter[]> {
    const url = this.createCompleteRoute('api/Bonus/GetBonusParameterData');
    return this.http
      .get<any>(url)
      .pipe(map((response) => response.bonusParameters || []));
  }

  //Get bonus rule list
  getBonusRuleList(): Observable<BonusRule[]> {
    const url = this.createCompleteRoute('api/Bonus/Getbonus-rules');
    return this.http.get<BonusRule[]>(url);
  }

  parseFinancialYear(financialYear: string): ParsedFinancialYear {
    // Split the string into start and end dates
    const [startDate, endDate] = financialYear.split(' - ');

    // Parse start date (format: "YYYY-MM")
    const [startYear, startMonth] = startDate.split('-').map(Number);

    // Parse end date (format: "YYYY-MM")
    const [endYear, endMonth] = endDate.split('-').map(Number);

    return {
      startMonth,
      startYear,
      endMonth,
      endYear
    };
  }

  // Helper method to get formatted financial years for dropdown
  getFormattedFinancialYears(): Observable<{
    id: string,
    year: string,
    parsedDates: ParsedFinancialYear,
    status: number
  }[]> {
    return this.getFinancialYears().pipe(
      map(financialYears => financialYears
        .map(fy => ({
          id: fy.utilityFinancialYearId,
          year: `${fy.financialYearStarts} - ${fy.financialYearEnds}`,
          parsedDates: this.parseFinancialYear(`${fy.financialYearStarts} - ${fy.financialYearEnds}`),
          status: fy.status
        })))
    );
  }

  getActiveBonusParameter(): Observable<BonusParameter> {
    const url = this.createCompleteRoute('api/Bonus/GetBonusParameterData');
    return this.http.get<any>(url).pipe(
      map((response) => response.bonusParameters || []),
      map((parameters: BonusParameter[]) => {
        const activeParameter = parameters.find(
          (param: BonusParameter) => param.status === 1
        );
        if (!activeParameter) {
          throw new Error('No active bonus parameter found');
        }
        return activeParameter;
      })
    );
  }

  // Get bonus parameter by ID
  getBonusParameterById(bonusParameterId: string): Observable<BonusParameter> {
    return this.getBonusParameterList().pipe(
      map(parameters => parameters.find(param => param.bonusParameterId === bonusParameterId)),
      map(parameter => {
        if (!parameter) {
          throw new Error('Bonus parameter not found');
        }
        return parameter;
      })
    );
  }

  // Create bonus employee eligibility
  createBonusEmployeeEligibility(requests: BonusEligibilityRequest[]): Observable<any> {
    const url = this.createCompleteRoute('api/Bonus/CreateBonusEmployeeEligibiltyBulk');
    return this.http.post(url, requests);
  }

  // Updated getBonusEmployeeList method to accept branchId and financialYearId
  getBonusEmployeeList(branchId: string, financialYearId: string): Observable<BonusEmployee[]> {
    const url = this.createCompleteRoute(`api/Bonus/Getbonus-eligibilities?BranchID=${branchId}&FinancialYearID=${financialYearId}`);
    return this.http.get<any[]>(url).pipe(
      map(employees => employees.map(emp => ({
        employeeEligibiltyDetailId: emp.employeeEligibiltyDetailId,
        employeeId: emp.employeeId,
        employeeCode: emp.employeeBasicDetail?.employeeCode,
        employeeName: emp.employeeBasicDetail?.employeeFirstName + " " + emp.employeeBasicDetail?.employeeMiddleName + " " + emp.employeeBasicDetail?.employeeLastName,
        totalAttendanceDays: emp.totalWorkingDays,
        fixedSalary: emp.fixedSalary,
        bonusRuleLimit: emp.bonusRatePercentage,
        bonusRuleId: emp.bonusRuleId,
        totalBonusCalculationValue: emp.totalBonusCalculationValue
      })))
    );
  }

  // For deleting employees from approved bonus list 
  deleteBonusEmployeeEligibility(employeeEligibiltyDetailId: string): Observable<any> {
    const url = this.createCompleteRoute(`api/Bonus/DeleteBonusEmployeeEligibilty?BonusEligibiltyDetailId=${employeeEligibiltyDetailId}`);
    return this.http.delete(url);
  }

  // Get all employees
  getAllEmployees(): Observable<EmployeeEligibilityDto[]> {
    const url = this.createCompleteRoute('api/EmployeeEligibility/GetAllEmployees');
    return this.http.get<EmployeeEligibilityDto[]>(url);
  }

  // Get eligible employees based on criteria
  getEligibleEmployees(criteria: EligibilityCriteriaDto): Observable<EmployeeEligibilityDto[]> {
    const url = this.createCompleteRoute('api/EmployeeEligibility/GetEligibleEmployees');
    return this.http.post<EmployeeEligibilityDto[]>(url, criteria);
  }

  // Get eligibility criteria settings
  getEligibilityCriteria(): Observable<EligibilityCriteriaDto> {
    const url = this.createCompleteRoute('api/EmployeeEligibility/GetCriteria');
    return this.http.get<EligibilityCriteriaDto>(url);
  }

  // Update eligibility criteria settings
  updateEligibilityCriteria(criteria: EligibilityCriteriaDto): Observable<EligibilityCriteriaDto> {
    const url = this.createCompleteRoute('api/EmployeeEligibility/UpdateCriteria');
    return this.http.put<EligibilityCriteriaDto>(url, criteria);
  }

  // Approve selected employees for bonus
  approveEmployeesForBonus(approvalRequest: ApprovalRequestEligibilityDto): Observable<ApprovalResponseEligibilityDto> {
    const url = this.createCompleteRoute('api/EmployeeEligibility/ApproveBonus');
    return this.http.post<ApprovalResponseEligibilityDto>(url, approvalRequest);
  }

  // Get bonus approval history
  getBonusApprovalHistory(startDate?: Date, endDate?: Date): Observable<ApprovalResponseEligibilityDto[]> {
    let url = this.createCompleteRoute('api/EmployeeEligibility/ApprovalHistory');
    if (startDate && endDate) {
      url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }
    return this.http.get<ApprovalResponseEligibilityDto[]>(url);
  }

  getEmployeeDetails(bonusParameterId: string, yearId: string, branchId: string, startMonth: number, startYear: number, endMonth: number, endYear: number): Observable<any> {
    const url = this.createCompleteRoute(
      `api/Bonus/GetEmployeeDetails?BonusParameterId=${bonusParameterId}&financialYearId=${yearId}&companyBranchId=${branchId}&startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`
    );
    return this.http.get<any>(url);
  }

  // Get employee bonus details by ID
  getEmployeeBonusDetails(employeeId: number): Observable<EmployeeEligibilityDto> {
    const url = this.createCompleteRoute(`api/EmployeeEligibility/Employee/${employeeId}`);
    return this.http.get<EmployeeEligibilityDto>(url);
  }

  // Update employee working days
  updateEmployeeWorkingDays(employeeId: number, workingDays: number): Observable<EmployeeEligibilityDto> {
    const url = this.createCompleteRoute(`api/EmployeeEligibility/UpdateWorkingDays/${employeeId}`);
    return this.http.put<EmployeeEligibilityDto>(url, { workingDays });
  }

  // Get department-wise bonus summary
  getDepartmentBonusSummary(): Observable<any> {
    const url = this.createCompleteRoute('api/EmployeeEligibility/DepartmentSummary');
    return this.http.get(url);
  }

  // Export eligible employees to Excel
  exportEligibleEmployees(criteria: EligibilityCriteriaDto): Observable<Blob> {
    const url = this.createCompleteRoute('api/EmployeeEligibility/Export');
    return this.http.post(url, criteria, { responseType: 'blob' });
  }
}
