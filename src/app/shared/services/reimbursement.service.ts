import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_helpers/environment';
import { ReimbursementLimitDto } from '../../_models/reimbursement-limit-dto.model';


@Injectable({
  providedIn: 'root'
})
export class ReimbursementService {
  reimbursementData: any;
  public reimbursementUrl: string = environment.reimbursementUrl;

  constructor(private http: HttpClient) { }

  setReimbursementData(data: any): void {
    this.reimbursementData = data;
  }

  getReimbursementData(): any {
    return this.reimbursementData;
  }

  clearReimbursementData(): void {
    this.reimbursementData = null;
  }

  // Reimbursement Master TYPE  Method

  private createCompleteRoute = (route: string) => {
    return `${this.reimbursementUrl}/${route}`;
  };

  public getData = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route)
    );
  };

  public postData = (route: string, body: any) => {
    let url = this.createCompleteRoute(route);
    return this.http.post<any[]>(url, body);
  };

  public updateData = (route: string, body: any) => {
    let url = this.createCompleteRoute(route);
    return this.http.put(url, body);
  };

  public getDataWithBranchId<T>(
    route: string,
    options?: { headers?: HttpHeaders }
  ): Observable<T> {
    let url = this.createCompleteRoute(route);
    return this.http.get<T>(url, options);
  }

  public getDesignation = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route)
    );
  };


  getreimbursementList(): Observable<any> {
    return this.http.get(
      `${this.reimbursementUrl}/api/Reimbersment/ReimbursementMasterList`
    );
  }

  getReimbursementMasterById(id: number): Observable<any> {
    const url = `${this.reimbursementUrl}/api/Reimbersment/ReimbursementMasterById?GuidReimbursementsId=${id}`;
    return this.http.get(url);
  }

  createreimbursement(data: any): Observable<any> {
    return this.http.post(
      `${this.reimbursementUrl}/api/Reimbersment/CreateReimbursementMaster`,
      data
    );
  }

  updatereimbursement(data: any): Observable<any> {
    return this.http.put(
      `${this.reimbursementUrl}/api/Reimbersment/ReimbursementMasterUpdate`,
      data
    );
  }

  deletereimbursement(id: number): Observable<any> {
    const url = `${this.reimbursementUrl}/api/Reimbursements/DeleteReimbursementMaster?GuidReimbursementsId=${id}`;
    return this.http.delete(url);
  }

  getEmployeeId(): Observable<any> {
    return this.http.get(
      `${this.reimbursementUrl}/api/Employee/EmployeeBasicDetailList`
    );
  }

  getreimburshmentLimitsId(): Observable<any> {
    return this.http.get(
      `${this.reimbursementUrl}/api/Reimbersment/ReimbursementLimitList`
    );
  }

  public putReimbursementLimit = (route: string, body: ReimbursementLimitDto) => {
    let url = this.createCompleteRoute(route);
    return this.http.put(url, body);
  };

  public postEmployeeReimbursementLimit = (
    route: string,
    body: ReimbursementLimitDto
  ) => {
    let url = this.createCompleteRoute(route);
    return this.http.post(url, body);
  };

  //finance dashboard :

  getreimburshmentRequest(): Observable<any> {
    return this.http.get(
      `${this.reimbursementUrl}/api/Reimbursements/GetReimbursementRequest`
    );
  }

  getreimburshmentRequestStatus(): Observable<any> {
    return this.http.get(
      `${this.reimbursementUrl}/api/Reimbursements/ReimbursementRequestStatusList`
    );
  }

  getDepartmentList(): Observable<any> {
    return this.http.get(
      `${this.reimbursementUrl}/api/Department/DepartmentList`
    );
  }

  getApprovedListByManagerId(id: string): Observable<any> {
    console.log('API Call with Manager ID:', id);
    const url = `${this.reimbursementUrl}/api/Reimbursements/GetApprovedListbyManagerId?managerId=${id}`;
    return this.http.get(url);
  }

  getByManagerId(id: string): Observable<any> {
    console.log('API Call with Manager ID:', id);
    const url = `${this.reimbursementUrl}/api/Reimbersment/GetByManagerId?managerId=${id}`;
    return this.http.get(url);
  }

}
