import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_helpers/environment';
import { EnvironmentUrlService } from './environment-url.service';
@Injectable({
  providedIn: 'root'
})
export class MasterService {

public masterUrlAddress : string =environment.masterUrlAddress;
  constructor(
    private http: HttpClient,
    private envUrl: EnvironmentUrlService
  ) { }

  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  };

  public getData = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.masterUrlAddress)
    );
  };

  public postData = (route: string, body: any) => {
    let url = this.createCompleteRoute(route, this.masterUrlAddress);
    return this.http.post<any[]>(url, body);
  };

  public updateData = (route: string, body: any) => {
    let url = this.createCompleteRoute(route, this.masterUrlAddress);
    return this.http.put(url, body);
  };

  public getDataWithBranchId<T>(
    route: string,
    options?: { headers?: HttpHeaders }
  ): Observable<T> {
    let url = this.createCompleteRoute(route, this.masterUrlAddress);
    return this.http.get<T>(url, options);
  }
}
