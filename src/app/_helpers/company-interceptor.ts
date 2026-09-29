import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Attaches the currently-selected company (and its branch/department scope)
 * to every outgoing request, mirroring the X-Tenant-Schema pattern.
 * Backend services use these headers to scope data when the caller has
 * access to more than one company within a group.
 */
@Injectable()
export class CompanyInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const raw = sessionStorage.getItem('activeCompany');
    if (!raw) {
      return next.handle(req);
    }

    try {
      const active = JSON.parse(raw);
      const headers: { [name: string]: string } = {};

      if (active?.hrmsCompanyId) {
        headers['X-Hrms-Company-Id'] = active.hrmsCompanyId;
      }
      if (active?.hrmsGroupId) {
        headers['X-Hrms-Group-Id'] = active.hrmsGroupId;
      }
      // If user has drilled into a specific branch, scope to that branch only;
      // otherwise send all branch IDs for the active company.
      if (active?.selectedBranchId) {
        headers['X-Hrms-Branch-Ids'] = active.selectedBranchId;
      } else if (Array.isArray(active?.branches) && active.branches.length) {
        headers['X-Hrms-Branch-Ids'] = active.branches
          .map((b: any) => b.hrmsbranchId)
          .filter(Boolean)
          .join(',');
      }
      if (active?.departmentIds) {
        // departmentIds is stored as a JSON-serialised array, e.g. ["d1","d2"];
        // send it to the backend as a simple comma-separated list of IDs.
        try {
          const ids = JSON.parse(active.departmentIds);
          if (Array.isArray(ids) && ids.length) {
            headers['X-Department-Ids'] = ids.join(',');
          }
        } catch {
          headers['X-Department-Ids'] = active.departmentIds;
        }
      }

      if (Object.keys(headers).length === 0) {
        return next.handle(req);
      }

      return next.handle(req.clone({ setHeaders: headers }));
    } catch {
      return next.handle(req);
    }
  }
}
