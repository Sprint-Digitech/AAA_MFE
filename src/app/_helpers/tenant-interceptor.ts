import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Always use 'dbo' for GetAllRegisteredEmails/GetAllEmployeeEmails APIs
    const isAlwaysDbo = req.url.includes('GetAllRegisteredEmails') || req.url.includes('GetAllEmployeeEmails');
    const tenantId = isAlwaysDbo
      ? 'dbo'
      : sessionStorage.getItem('tenantSchema') || 'dbo';
    console.log('Tenant ID:', tenantId);

    // Clone request with tenant schema header
    const modifiedReq = req.clone({
      setHeaders: { 'X-Tenant-Schema': tenantId },
    });

    return next.handle(modifiedReq);
  }
}
