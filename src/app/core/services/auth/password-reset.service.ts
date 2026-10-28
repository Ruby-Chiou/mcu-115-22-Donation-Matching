import { Injectable, inject } from '@angular/core';

import { passwordResetPageUrl } from '../../auth/oauth-redirect-url';
import { SupabaseService } from '../database/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private readonly supabase = inject(SupabaseService);

  /** 請客服信箱寄出自訂重設信；連結直接進本站設密碼頁。 */
  async requestResetEmail(email: string): Promise<string> {
    const trimmed = email.trim().toLowerCase();
    const resetPageUrl = passwordResetPageUrl(window.location.origin, document.querySelector('base')?.getAttribute('href'));

    const { data, error } = await this.supabase.client.functions.invoke('request-password-reset', {
      body: { email: trimmed, resetPageUrl },
    });

    if (error) {
      throw new Error((await functionErrorMessage(error)) || '重設密碼信目前無法寄出，請稍後再試。');
    }

    const message = (data as { message?: string } | null)?.message;
    return message || '若此信箱已註冊，重設密碼信已由客服信箱寄出。請查看收件匣與垃圾郵件。';
  }

  /** 用信內 token 寫入新密碼（含先前只有 Google、尚未有密碼的帳號）。 */
  async confirmNewPassword(token: string, password: string): Promise<{ email: string; message: string }> {
    const { data, error } = await this.supabase.client.functions.invoke('confirm-password-reset', {
      body: { token, password },
    });

    if (error) {
      throw new Error((await functionErrorMessage(error)) || '新密碼沒有存下，請稍後再試。');
    }

    const body = data as { message?: string; email?: string } | null;
    if (!body?.email) {
      throw new Error(body?.message || '新密碼沒有存下，請稍後再試。');
    }

    return { email: body.email, message: body.message || '密碼已更新，請用新密碼登入。' };
  }
}

async function functionErrorMessage(error: { message?: string; context?: Response }): Promise<string> {
  const context = error.context;
  if (context) {
    try {
      const body = (await context.json()) as { message?: string };
      if (body.message) {
        return body.message;
      }
    } catch {
      // ignore
    }
  }

  return error.message ?? '';
}
