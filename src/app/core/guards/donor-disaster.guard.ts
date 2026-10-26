import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DisasterClosedModalService } from '../services/disaster-control/disaster-closed-modal.service';
export const donorDisasterGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const closedModal = inject(DisasterClosedModalService);

  const disasterOpen = localStorage.getItem('disasterOpen') === 'true';
  const path = state.url.split('?')[0] ?? '';

  // 大廳可以進來看到已關閉。物資、志工的內頁在關閉時擋下來。
  if (!disasterOpen && path.startsWith('/donor/disaster/')) {
    closedModal.show();

    return router.createUrlTree(['/donor/disaster']);
  }

  return true;
};
