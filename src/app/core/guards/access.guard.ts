import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { donorActionsOpen, isDonorPrivatePath, RoleAccessPolicy } from '../auth/role-access.policy';
import { safeReturnUrl } from '../auth/safe-return-url';
import { AuthPrincipal } from '../../models/auth/app-role';
import { AuthSessionService } from '../services/auth/auth-session.service';

export const accessGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);
  const policy = inject(RoleAccessPolicy);

  await auth.restore();

  const principal = auth.principal();
  const decision = policy.decide(principal.role, state.url);

  if (decision === 'allow') {
    const resumed = resumeStoredReturn(router, policy, principal);
    if (resumed) {
      return resumed;
    }

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

  const resumed = resumeStoredReturn(router, policy, principal, route.queryParamMap.get('returnUrl'));
  if (resumed) {
    return resumed;
  }

  return router.createUrlTree([policy.home(role)]);
};

/** 第三方登入離開前記下的頁面。回到首頁時若有這筆記錄，就繼續去那裡，而不是停在登入頁。 */
function resumeStoredReturn(
  router: Router,
  policy: RoleAccessPolicy,
  principal: AuthPrincipal,
  queryReturnUrl: string | null = null,
): UrlTree | null {
  const storedReturn = sessionStorage.getItem('dm-auth-return');
  if (principal.role === 'guest') {
    return null;
  }

  sessionStorage.removeItem('dm-auth-return');
  const returnUrl = safeReturnUrl(queryReturnUrl ?? storedReturn);

  if (!returnUrl || !policy.canActivate(principal.role, returnUrl)) {
    return null;
  }

  if (isDonorPrivatePath(returnUrl) && !donorActionsOpen(principal)) {
    return router.createUrlTree(['/member'], { queryParams: { notice: 'company-review' } });
  }

  return router.parseUrl(returnUrl);
}
