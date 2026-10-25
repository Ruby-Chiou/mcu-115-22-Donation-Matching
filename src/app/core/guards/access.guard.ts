import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { donorActionsOpen, isDonorPrivatePath, RoleAccessPolicy } from '../auth/role-access.policy';
import { safeReturnUrl } from '../auth/safe-return-url';
import { AuthSessionService } from '../services/auth/auth-session.service';

export const accessGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);
  const policy = inject(RoleAccessPolicy);

  await auth.restore();

  const principal = auth.principal();
  const decision = policy.decide(principal.role, state.url);

  if (decision === 'allow') {
    if (isDonorPrivatePath(state.url) && !donorActionsOpen(principal)) {
      return router.createUrlTree(['/member'], { queryParams: { notice: 'company-review' } });
    }

    return true;
  }

  if (decision === 'login') {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return router.createUrlTree([policy.home(auth.principal().role)]);
};

export const loginPageGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);
  const policy = inject(RoleAccessPolicy);

  await auth.restore();

  const principal = auth.principal();
  const role = principal.role;

  if (role === 'guest') {
    return true;
  }

  const storedReturn = sessionStorage.getItem('dm-auth-return');
  sessionStorage.removeItem('dm-auth-return');
  const returnUrl = safeReturnUrl(route.queryParamMap.get('returnUrl') ?? storedReturn);

  if (returnUrl && policy.canActivate(role, returnUrl)) {
    if (isDonorPrivatePath(returnUrl) && !donorActionsOpen(principal)) {
      return router.createUrlTree(['/member'], { queryParams: { notice: 'company-review' } });
    }

    return router.parseUrl(returnUrl);
  }

  return router.createUrlTree([policy.home(role)]);
};
