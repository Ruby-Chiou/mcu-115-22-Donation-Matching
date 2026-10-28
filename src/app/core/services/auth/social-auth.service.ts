import { Injectable, inject } from '@angular/core';
import { Provider } from '@supabase/supabase-js';

import { beginOAuthPersistence } from '../../auth/auth-storage';
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
    beginOAuthPersistence();

    const safe = safeReturnUrl(returnUrl);
    if (safe) {
      localStorage.setItem(RETURN_KEY, safe);
      sessionStorage.setItem(RETURN_KEY, safe);
    } else {
      localStorage.removeItem(RETURN_KEY);
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

  /**
   * 供應商沒開通時，授權網址常直接回 JSON 錯誤。
   * 只用 HEAD／不跟隨轉址，且忽略網路／CORS 失敗，避免預檢誤傷正常 Google／LINE／Facebook 登入。
   */
  private async assertProviderReady(url: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(url, { method: 'GET', redirect: 'manual', mode: 'cors' });
    } catch {
      return;
    }

    // 實際授權多半是 302；opaque 或無法讀 body 時不要擋
    if (response.type === 'opaqueredirect' || response.status === 0 || response.status < 400 || response.status >= 500) {
      return;
    }

    if (response.status === 404 || response.status === 401) {
      return;
    }

    const body = (await response.json().catch(() => null)) as { msg?: string; error_description?: string; error?: string } | null;
    const detail = body?.msg || body?.error_description || body?.error || '';
    if (/provider is not enabled|unsupported provider|validation_failed/i.test(detail)) {
      throw new Error(detail || 'provider is not enabled');
    }
  }
}
