import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * 公開：用信內 token 設定新密碼（含先前只用 Google 登入、尚未有密碼的帳號）。
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { message: '只接受送出新密碼。' });
  }

  try {
    const body = (await req.json().catch(() => null)) as { token?: unknown; password?: unknown } | null;
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || token.length < 32) {
      return json(400, { message: '重設連結無效或已過期，請重新申請忘記密碼。' });
    }

    if (!PASSWORD_PATTERN.test(password)) {
      return json(400, { message: '密碼須至少 8 碼，且同時包含英文大寫、小寫與數字。' });
    }

    const admin = adminClient();
    const tokenHash = await sha256Hex(token);

    const { data: row, error: readError } = await admin
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (readError) {
      console.error('讀取重設權杖失敗', readError.message);
      return json(500, { message: '無法驗證重設連結，請稍後再試。' });
    }

    if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
      return json(400, { message: '重設連結無效或已過期，請重新申請忘記密碼。' });
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(row.user_id);
    if (userError || !userData.user?.email) {
      return json(400, { message: '找不到對應帳號，請重新申請忘記密碼。' });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(row.user_id, {
      password,
      email_confirm: true,
    });

    if (updateError) {
      console.error('寫入新密碼失敗', updateError.message);
      return json(500, { message: '新密碼沒有存下，請稍後再試。' });
    }

    await admin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id);

    return json(200, {
      message: '密碼已更新，請用新密碼登入。',
      email: userData.user.email,
    });
  } catch (error) {
    console.error('確認重設密碼失敗', error instanceof Error ? error.message : error);
    return json(500, { message: '新密碼沒有存下，請稍後再試。' });
  }
});

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

function json(status: number, body: { message: string; email?: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
