import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { donorActionsOpen, isDonorPrivatePath, RoleAccessPolicy } from '../../auth/role-access.policy';
import { safeReturnUrl } from '../../auth/safe-return-url';
import { AuthSessionService } from './auth-session.service';

const HOME_REDIRECT_MS = 1600;

@Injectable({
  providedIn: 'root',
})
export class AuthRedirectService {
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly policy = inject(RoleAccessPolicy);

  async signIn(email: string, password: string, remember: boolean, returnUrl: string | null): Promise<string> {
    await this.auth.signIn(email, password, remember);
    const target = this.destination(returnUrl);
    await this.navigateAfterNotice(target);
    return target;
  }

  /** 註冊或登入成功後先留提示，再導向該身分首頁，避免停在表單頁。 */
  async navigateAfterNotice(url: string, delayMs = HOME_REDIRECT_MS): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), delayMs);
    });
    await this.router.navigateByUrl(url);
  }

  /** 訪客點捐物或報名時先去登入；已登入但身分不符則回自己的首頁。 */
  async openDonorAction(url: string): Promise<void> {
    await this.auth.restore();
    const role = this.auth.principal().role;

    if (this.policy.canActivate(role, url)) {
      if (isDonorPrivatePath(url) && !donorActionsOpen(this.auth.principal())) {
        await this.router.navigate(['/member'], { queryParams: { notice: 'company-review' } });
        return;
      }

      await this.router.navigateByUrl(url);
      return;
    }

    if (role === 'guest') {
      await this.router.navigate(['/login'], { queryParams: { returnUrl: url } });
      return;
    }

    await this.router.navigateByUrl(this.policy.home(role));
  }

  private destination(returnUrl: string | null): string {
    const role = this.auth.principal().role;
    const safe = safeReturnUrl(returnUrl);

    if (safe && this.policy.canActivate(role, safe)) {
      if (isDonorPrivatePath(safe) && !donorActionsOpen(this.auth.principal())) {
        return '/member?notice=company-review';
      }

      return safe;
    }

    return this.policy.home(role);
  }
}
