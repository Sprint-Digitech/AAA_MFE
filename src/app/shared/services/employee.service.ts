import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EnvironmentUrlService } from './environment-url.service';
import { Observable } from 'rxjs';
import { environment } from '../../_helpers/environment';

interface EmployeeID {
  employeeId: string | null;
}

interface EmployeeCtcID {
  employeectcid: string | null;
}
@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  public urlAddress: string = environment.urlAddress;
  public salaryUrlAddress: string = environment.salaryUrlAddress;
  public reportsUrl: string = environment.reportsUrl;
  public biometricAddress: string = environment.biometricAddress;
  public EssUrlAddress: string = environment.EssUrlAddress;
  private employeeId: any;
  constructor(
    private http: HttpClient,
    private envUrl: EnvironmentUrlService
  ) { }
  setEmployeeId(id: string): void {
    this.employeeId = id;
  }
  private sourceData: any;
  checkList: any;
  setContactData(data: any): void {
    this.sourceData = data;
  }

  getContactData(): any {
    return this.sourceData;
  }
  //for ess
  public getEssData(route: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.EssUrlAddress)
    );
  }
  public getESSSalaries = (route: string, options?: any): Observable<any[]> => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.EssUrlAddress),
      options
    ) as unknown as Observable<any[]>;
  };
  // for reports
  public getReportData(route: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.reportsUrl)
    );
  }
  getDatas(): Observable<any> {
    return this.http.get(
      this.createCompleteRoute(
        'api/company-branch/GetCompanyBranch',
        this.envUrl.urlAddress
      )
    );
  }

  clearContactData(): void {
    this.sourceData = null;
  }
  getEmployeeId(): string {
    return this.employeeId;
  }
  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  };

  public getData = (route: string) => {
    return this.http.get(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployee = (route: any, params?: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress),
      { params }
    );
  };
  public getSalaryEmployeeId = (route: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployeeCTCID = (route: any) => {
    return this.http.get<EmployeeCtcID>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getSalaryDetails = (route: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public GetEmployeeSalaryByYear = (route: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployeeContactDetails = (route: string, params?: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress),
      { params }
    );
  };
  public getEmployeeEducationDetailsreport = (route: string, params?: any) => {
    return this.http.get(
      this.createCompleteRoute(route, this.salaryUrlAddress),
      { params }
    );
  };

  public getEmployeeSalaries = (route: string, options?: any): Observable<any[]> => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress),
      options
    ) as unknown as Observable<any[]>;
  };
  public getEmployeeSummaries = (route: string): Observable<any[]> => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployeeDetail = (route: string) => {
    return this.http.get(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getCompany(route: string) {
    return this.http.get(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  }

  public deleteEmployee = (route: string) => {
    return this.http.delete(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployeeForUpdate = (route: string) => {
    return this.http.get(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

}
