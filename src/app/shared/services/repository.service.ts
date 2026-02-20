//import { Company } from './../../_interfaces/company.model';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../_helpers/environment';
import { EnvironmentUrlService } from './environment-url.service';

@Injectable({
  providedIn: 'root',
})
export class RepositoryService {
  public urlAddress: string = environment.urlAddress;
  public reportsUrl: string = environment.reportsUrl;
  public salaryUrlAddress: string = environment.salaryUrlAddress;


  constructor(
    private http: HttpClient,
    private envUrl: EnvironmentUrlService

  ) { }

  private repaymentData = new BehaviorSubject<any>(null);
  repaymentData$ = this.repaymentData.asObservable();

  setRepaymentData(data: any) {
    this.repaymentData.next(data);
  }

  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  };
  //for report 
  public getReportData(route: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.reportsUrl)
    );
  }

  //for salry 
  public getData = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public postData = (route: string, body: any) => {
    let url = this.createCompleteRoute(route, this.salaryUrlAddress);
    return this.http.post<any[]>(url, body);
  };

  public updateData = (route: string, body: any) => {
    let url = this.createCompleteRoute(route, this.salaryUrlAddress);
    return this.http.put(url, body);
  };

  public getSalaryDetails = (route: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployeeSalary = (route: string): Observable<any[]> => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployee = (route: any, params?: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress),
      { params }
    );
  };

  public getEmployeeSummaries = (route: string): Observable<any[]> => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  public getEmployeeSalaries = (route: string, options?: any): Observable<any[]> => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress),
      options
    ) as unknown as Observable<any[]>;
  };

  public getBranch = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.salaryUrlAddress)
    );
  };

  deleteData(route: string, body: any = {}) {
    // Handle text responses (like "Tenant control removed successfully")
    return this.http.put(this.createCompleteRoute(route, this.salaryUrlAddress), body, {
      responseType: 'text' as 'json'
    });
  }
 public getCompany = (route: string, headers?: HttpHeaders) => {
    const options = headers ? { headers } : {};
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.envUrl.urlAddress),
      options
    );
  };
}
