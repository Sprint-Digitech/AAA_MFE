import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

export const productLoginGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const product = route.queryParamMap.get('product') || '';

  if (product.toLowerCase() === 'wms') {
    return router.createUrlTree(['/login-inventory']);
  }

  return true;
};
