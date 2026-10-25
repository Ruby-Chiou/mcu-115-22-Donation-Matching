import { Injectable, inject } from '@angular/core';
import { Provider } from '@supabase/supabase-js';

import { oauthRedirectUrl } from '../../auth/oauth-redirect-url';
import { safeReturnUrl } from '../../auth/safe-return-url';
import { SupabaseService } from '../database/supabase.service';

export type SocialProvider = 'google' | 'line' | 'facebook';

const RETURN_KEY = 'dm-auth-return';

/**
 * 個人捐助者的第三方登入。公司名義不能走這條路。
 * 供應商要在 Supabase Auth 啟用，並把站台網址加進 Redirect URLs。
 */
@Injectable({ providedIn: 'root' })
export class SocialAuthService {
  private readonly supabase = inject(SupabaseService);

  async start(provider: SocialProvider, returnUrl: string | null): Promise<void> {
    const safe = safeReturnUrl(returnUrl);
    if (safe) {
      sessionStorage.setItem(RETURN_KEY, safe);
    } else {
      sessionStorage.removeItem(RETURN_KEY);
    }

    const { data, error } = await this.supabase.client.auth.signInWithOAuth({
      provider: provider === 'line' ? 'custom:line-login' : (provider as Provider),
      options: {
        redirectTo: oauthRedirectUrl(window.location.origin, document.querySelector('base')?.getAttribute('href')),
        scopes: provider === 'facebook' ? 'public_profile email' : undefined,
        queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.url) {
      throw new Error('無法開始第三方登入。');
    }

    await this.assertProviderReady(data.url);
    window.location.assign(data.url);
  }

  /** 供應商沒開通時，授權網址會直接回錯誤，而不是把人送回登入頁。先看過再跳轉。 */
  private async assertProviderReady(url: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(url, { method: 'GET', redirect: 'manual' });
    } catch {
      return;
    }

    if (response.type === 'opaqueredirect' || response.status === 0 || response.status < 400) {
      return;
    }

    const body = (await response.json().catch(() => null)) as { msg?: string; error_description?: string } | null;
    throw new Error(body?.msg || body?.error_description || 'provider is not enabled');
  }
}
