import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = sessionStorage.getItem('user');
  if (!user || user === 'null') {
    return router.createUrlTree(['/login']);
  }
  return true;
};
