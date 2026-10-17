import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withNavigationErrorHandler, withHashLocation } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

import { TenantInterceptor } from './_helpers/tenant-interceptor';
import { CompanyInterceptor } from './_helpers/company-interceptor';
import { ErrorInterceptor } from './_helpers/error-interceptor';
import { LoaderInterceptor } from './loader/loader.interceptor';
import { TokenRefreshInterceptor } from './_helpers/token-refresh.interceptor';
import { JwtInterceptor } from './_helpers/jwt-interceptor.interceptor';
import { TimeoutInterceptor } from './_helpers/timeout.interceptor';
import { SOCIAL_AUTH_CONFIG, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import {
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';

import { routes } from './app.routes';

// After a deploy, a tab still running the old main.js asks for lazy chunks that no longer exist and the
// route renders nothing. Reload once to pick up the new build (the flag stops a reload loop).
function reloadOnStaleChunk(err: { error: any }): void {
  const msg = String(err?.error?.message || err?.error || '');
  if (!/Loading chunk|ChunkLoadError|dynamically imported module|Importing a module script failed/i.test(msg)) return;
  try {
    if (sessionStorage.getItem('fv-chunk-reload')) return;
    sessionStorage.setItem('fv-chunk-reload', '1');
    setTimeout(() => sessionStorage.removeItem('fv-chunk-reload'), 30000);
  } catch { /* storage blocked - still try once */ }
  location.reload();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation(), withNavigationErrorHandler(reloadOnStaleChunk)),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule, MatDialogModule),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TenantInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CompanyInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenRefreshInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimeoutInterceptor,
      multi: true,
    },
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              ''
            )
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }
  ],
};
