import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DisasterClosedModalService } from '../services/disaster-closed-modal.service';
export const donorDisasterGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const closedModal = inject(DisasterClosedModalService);

  const disasterOpen = localStorage.getItem('disasterOpen') === 'true';

  // 如果目前災害是「關閉」
  // 不允許進入 disaster-open
  if (state.url.startsWith('donor/disaster') && !disasterOpen) {
    closedModal.show();

    return router.createUrlTree(['/donor/disaster']);
  }

  return true;
};
