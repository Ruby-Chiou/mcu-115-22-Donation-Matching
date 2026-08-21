import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
export const disasterOpenGuard : CanActivateFn = (route, state) => {

  const router = inject(Router);

  const disasterOpen =
    localStorage.getItem('disasterOpen') === 'true';


  // 如果目前災害是「開啟」
  // 不允許進入未開啟的 donor-disaster
  if (
    state.url === '/donor/disaster' &&
    disasterOpen
  ) {

    return router.createUrlTree([
      '/disaster/open'
    ]);

  }


  // 如果目前災害是「關閉」
  // 不允許進入 disaster-open
  if (
    state.url.startsWith('/disaster/open') &&
    !disasterOpen
  ) {

    return router.createUrlTree([
      '/donor/disaster'
    ]);

  }


  return true;
};
