import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';

const LOADER_DELAY_MS = 80;

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  constructor(private loaderService: LoaderService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.headers.has('X-Skip-Loader')) {
      const newReq = req.clone({ headers: req.headers.delete('X-Skip-Loader') });
      return next.handle(newReq);
    }

    let shown = false;
    const showTimer = setTimeout(() => {
      shown = true;
      this.loaderService.show();
    }, LOADER_DELAY_MS);

    return next.handle(req).pipe(
      finalize(() => {
        clearTimeout(showTimer);
        if (shown) {
          this.loaderService.hide();
        }
      })
    );
  }
}
