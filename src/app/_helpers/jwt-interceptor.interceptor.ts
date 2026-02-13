import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountService } from '../shared/services/account.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private accountService: AccountService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add auth header with jwt if user is logged in and request is to the api url
    const token = sessionStorage.getItem('token');
    const parsedToken = token ? JSON.parse(token) : null;
    
    // Add token to request if it exists
    if (parsedToken) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${parsedToken}` }
      });
    }
    
    return next.handle(request);
}
}
