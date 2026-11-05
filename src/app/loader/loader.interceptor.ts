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

// Only show the overlay for requests still running after this long. 80 ms was below
// the browser round trip, so even 40 ms server responses flashed "Loading...".
const LOADER_DELAY_MS = 400;

// Background calls (shell polling, chat, logo) never block the screen.
const BACKGROUND_URLS = [
  '/api/notification/getnotifications',
  '/api/approvals/count',
  '/hubs/chat',
  '/api/chat/',
  '/company-logos/',
  '/api/roles/getusermenus',
  '/api/hrmsauthz/my-companies',
];

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  constructor(private loaderService: LoaderService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const url = req.url.toLowerCase();
    if (BACKGROUND_URLS.some((u) => url.includes(u))) {
      return next.handle(req);
    }

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
