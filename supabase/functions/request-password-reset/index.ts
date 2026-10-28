import { createClient } from 'npm:@supabase/supabase-js@2';

import { MAIL_FROM_NAME, PLATFORM_NAME, SUPPORT_EMAIL } from '../notify-support-complaint/complaint-mail.ts';
import { MailConfigError, sendMailboxMail } from '../notify-support-complaint/gmail-smtp.ts';

/**
 * 公開：客服信箱寄出自訂重設密碼信。
 * 連結直接進本站 /login?reset=1&token=...，由 confirm-password-reset 寫入新密碼。
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const OK_MESSAGE = '若此信箱已註冊，重設密碼信已由客服信箱寄出。請查看收件匣與垃圾郵件。';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { message: '只接受送出重設密碼請求。' });
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      email?: unknown;
      resetPageUrl?: unknown;
      siteUrl?: unknown;
    } | null;

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const resetPageUrl = normalizeResetPageUrl(body?.resetPageUrl ?? body?.siteUrl);

    if (!EMAIL_PATTERN.test(email)) {
      return json(400, { message: '請輸入正確的電子信箱。' });
    }

    if (!resetPageUrl) {
      return json(400, { message: '重設連結網址無效。' });
    }

    const admin = adminClient();
    const { data: userId, error: findError } = await admin.rpc('find_auth_user_id_by_email', { p_email: email });

    if (findError) {
      console.error('查詢重設帳號失敗', findError.message);
      return json(200, { message: OK_MESSAGE });
    }

    if (!userId) {
      return json(200, { message: OK_MESSAGE });
    }

    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await admin.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('user_id', userId).is('used_at', null);

    const { error: insertError } = await admin.from('password_reset_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('寫入重設權杖失敗', insertError.message);
      return json(500, { message: '重設密碼信目前無法寄出，請稍後再試。' });
    }

    const resetUrl = buildResetUrl(resetPageUrl, token);
    const letter = resetLetter(email, resetUrl);

    await sendMailboxMail({
      to: email,
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    });

    return json(200, { message: OK_MESSAGE });
  } catch (error) {
    console.error('重設密碼信沒有寄出', error instanceof Error ? error.message : error);
    const message = error instanceof MailConfigError ? error.message : '重設密碼信目前無法寄出，請稍後再試。';
    return json(500, { message });
  }
});

function normalizeResetPageUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    // 允許傳入網站根或 /login；最後一律落到登入頁
    if (!/\/login\/?$/i.test(url.pathname)) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/login`;
    }
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function buildResetUrl(resetPageUrl: string, token: string): string {
  const url = new URL(resetPageUrl);
  url.searchParams.set('reset', '1');
  url.searchParams.set('token', token);
  return url.toString();
}

function resetLetter(email: string, resetUrl: string): { subject: string; text: string; html: string } {
  const subject = `【${PLATFORM_NAME}】重設登入密碼`;
  const text = [
    `${PLATFORM_NAME}客服中心`,
    '',
    '您好：',
    '',
    `我們收到以 ${email} 提出的重設密碼請求。`,
    '請在一小時內點選下列連結，回到本平台設定新密碼：',
    '',
    resetUrl,
    '',
    '若不是你本人操作，可忽略這封信，帳號不會變更。',
    '',
    '————————————————',
    `${MAIL_FROM_NAME}`,
    `客服信箱：${SUPPORT_EMAIL}`,
    '這封信由平台客服信箱寄出，不是 Supabase 系統信。',
  ].join('\n');

  const html = `
  <div style="font-family:'Microsoft JhengHei',Arial,sans-serif;line-height:1.7;color:#1f2a37;max-width:560px;margin:0 auto;padding:24px">
    <div style="border-left:4px solid #1b6ca8;padding:4px 0 4px 14px;margin-bottom:20px">
      <div style="font-size:18px;font-weight:700;color:#1b6ca8">${escapeHtml(PLATFORM_NAME)}</div>
      <div style="font-size:13px;color:#5c6b7a">客服中心</div>
    </div>
    <p>您好：</p>
    <p>我們收到以 <strong>${escapeHtml(email)}</strong> 提出的重設密碼請求。</p>
    <p>請在一小時內點選下方按鈕，回到本平台設定新密碼：</p>
    <p style="margin:28px 0">
      <a href="${escapeAttr(resetUrl)}" style="display:inline-block;background:#1b6ca8;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">設定新密碼</a>
    </p>
    <p style="font-size:13px;color:#5c6b7a;word-break:break-all">若按鈕無法開啟，請複製此連結：<br>${escapeHtml(resetUrl)}</p>
    <p style="font-size:13px;color:#5c6b7a">若不是你本人操作，可忽略這封信，帳號不會變更。</p>
    <hr style="border:none;border-top:1px solid #e5eaf0;margin:24px 0" />
    <p style="font-size:12px;color:#7a8794;margin:0">
      ${escapeHtml(MAIL_FROM_NAME)}<br>
      客服信箱：${escapeHtml(SUPPORT_EMAIL)}<br>
      這封信由平台客服信箱寄出，不是第三方驗證系統的預設信件。
    </p>
  </div>`;

  return { subject, text, html };
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY');
  if (!url || !serviceKey) {
    throw new Error('寄信服務還沒有資料庫金鑰。');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function json(status: number, body: { message: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
