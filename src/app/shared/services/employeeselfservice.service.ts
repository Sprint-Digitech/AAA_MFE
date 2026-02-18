import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../_helpers/environment';
import { map, forkJoin } from 'rxjs';


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

@Injectable({
  providedIn: 'root'
})
export class EmployeeselfserviceService {
  private apiUrl = `${environment.urlAddress}/api/EmployeeSelfService`;
  public EssUrlAddress: string = environment.EssUrlAddress;
  
  constructor(private http : HttpClient) { }

  getEmployeeById(employeeId: string): Observable<any> {
    const url = `${this.EssUrlAddress}/api/EmployeeSelfService/GetEmployeeById?employeeId=${employeeId}`;
    return this.http.get<any>(url);
  }

  updateEmployee(employeeData: any): Observable<string> {
    const url = `${this.EssUrlAddress}/api/EmployeeSelfService/UpdateEmployee`;
    return this.http.put(url, employeeData, { responseType: "text" });
  }

  updateEmergencyContact(emergencyContactData: any): Observable<any> {
    const url = `${this.EssUrlAddress}/api/EmployeeSelfService/UpdateEmployeeFamily`;
    return this.http.put<any>(url, emergencyContactData); 
  }

  get(employeeData: any): Observable<string> {
    const url = `${this.EssUrlAddress}/api/EmployeeSelfService/UpdateEmployee`;
    return this.http.put(url, employeeData, { responseType: "text" });
  }
  
  getSalaryAndTax(employeeId: string): Observable<any> {
    const url = `${this.EssUrlAddress}/api/EmployeeSelfService/LastSalaryWithDeductions?employeeId=${employeeId}`;
    return this.http.get<any>(url);
  }
   getFinancialYears(): Observable<UtilityFinancialYear[]> {
    const url = `${this.EssUrlAddress}/api/UtilityFinancialYear/UtilityFinancialYeartList`;
    return this.http.get<UtilityFinancialYear[]>(url);
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
  
}
