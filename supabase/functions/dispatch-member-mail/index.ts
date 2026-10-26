import { createClient } from 'npm:@supabase/supabase-js@2';

import { MailConfigError, sendMailboxMail } from '../notify-support-complaint/gmail-smtp.ts';

/**
 * 把到期的通知信依收件者合併成一封，用既有的 Gmail 寄出。
 * 由已登入的捐助者或受助者在打開網站時觸發。
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type OutboxRow = {
  id: number;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  content: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { message: '只接受寄出到期通知。' });
  }

  try {
    const admin = adminClient();
    const uid = await signedInUid(req, admin);
    if (!uid) {
      return json(401, { message: '請先登入。' });
    }

    const sent = await dispatch(admin);
    return json(200, { mailed: true, mailNotice: sent === 0 ? '' : `已寄出 ${sent} 封通知。` });
  } catch (error) {
    console.error('通知信沒有寄出', error instanceof Error ? error.message : error);
    const message = error instanceof MailConfigError ? error.message : '通知信沒有寄出。';
    return json(500, { message });
  }
});

async function dispatch(admin: ReturnType<typeof adminClient>): Promise<number> {
  const { data, error } = await admin
    .from('member_email_outbox')
    .select('id, recipient_email, recipient_name, subject, content')
    .is('sent_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .order('id', { ascending: true })
    .limit(100);

  if (error) {
    console.error('讀取待寄通知失敗', error.message);
    throw new Error('讀取待寄通知失敗。');
  }

  const groups = new Map<string, OutboxRow[]>();
  for (const row of (data ?? []) as OutboxRow[]) {
    const key = row.recipient_email.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  let sent = 0;
  for (const rows of groups.values()) {
    const first = rows[0];
    const letter = rows.length === 1 ? singleLetter(first) : digestLetter(first.recipient_name, rows);
    try {
      await sendMailboxMail({
        to: first.recipient_email,
        toName: first.recipient_name,
        subject: letter.subject,
        text: letter.text,
        html: letter.html,
      });
      const { error: markError } = await admin
        .from('member_email_outbox')
        .update({ sent_at: new Date().toISOString(), last_error: null })
        .in('id', rows.map((row) => row.id));
      if (markError) {
        console.error('通知信已寄出，但沒有標成已寄', markError.message);
      }
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : '寄信失敗';
      console.error('這批通知沒有寄出', message);
      await admin
        .from('member_email_outbox')
        .update({ last_error: message })
        .in('id', rows.map((row) => row.id));
      if (error instanceof MailConfigError) {
        throw error;
      }
    }
  }

  return sent;
}

function singleLetter(row: OutboxRow): { subject: string; text: string; html: string } {
  const text = `${row.recipient_name} 你好：\n\n${row.content}\n\n這封信來自智慧捐助媒合平台的站內通知。`;
  return {
    subject: row.subject,
    text,
    html: `<p>${escapeHtml(row.recipient_name)} 你好：</p><p>${escapeHtml(row.content).replaceAll('\n', '<br>')}</p><p>這封信來自智慧捐助媒合平台的站內通知。</p>`,
  };
}

function digestLetter(name: string, rows: OutboxRow[]): { subject: string; text: string; html: string } {
  const text = [
    `${name} 你好：`,
    '',
    `你有 ${rows.length} 則新通知。`,
    '',
    ...rows.flatMap((row) => [`【${row.subject}】`, row.content, '']),
    '這封信來自智慧捐助媒合平台的站內通知。',
  ].join('\n');
  const items = rows
    .map((row) => `<h2>${escapeHtml(row.subject)}</h2><p>${escapeHtml(row.content).replaceAll('\n', '<br>')}</p>`)
    .join('');
  return {
    subject: `你有 ${rows.length} 則新通知`,
    text,
    html: `<p>${escapeHtml(name)} 你好：</p><p>你有 ${rows.length} 則新通知。</p>${items}<p>這封信來自智慧捐助媒合平台的站內通知。</p>`,
  };
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

async function signedInUid(req: Request, admin: ReturnType<typeof adminClient>): Promise<string | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (token.split('.').length !== 3) {
    return null;
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

function json(status: number, body: { message?: string; mailed?: boolean; mailNotice?: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
