import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DisasterClosedModalService } from '../services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from '../services/disaster-control/disaster-control.service';
export const donorDisasterGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const closedModal = inject(DisasterClosedModalService);
  const disasterControl = inject(DisasterControlService);

  await disasterControl.initialized;
  const disasterOpen = disasterControl.data().isOpen;
  const path = state.url.split('?')[0] ?? '';

  // 大廳可以進來看到已關閉。物資、協力者的內頁在關閉時擋下來。
  if (!disasterOpen && path.startsWith('/donor/disaster/')) {
    closedModal.show();

    return router.createUrlTree(['/donor/disaster']);
  }

  return true;
};
