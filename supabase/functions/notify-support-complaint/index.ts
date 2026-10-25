import { createClient } from 'npm:@supabase/supabase-js@2';

import { ComplaintInputError, closeLetter, complaintLetter, parseComplaint, parseReply, replyLetter } from './complaint-mail.ts';
import { MailConfigError, sendReplyCopy, sendSupportCopy } from './gmail-smtp.ts';

/**
 * 聯絡表單送出後先寫入 support_complaints，再寄一份到客服信箱。
 * Gmail 應用程式密碼只放在 Supabase secret：GMAIL_APP_PASSWORD。
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { message: '只接受送出客訴。' });
  }

  try {
    return json(200, await handle(req));
  } catch (error) {
    if (error instanceof ComplaintInputError) {
      return json(400, { message: error.message });
    }

    console.error('送出客訴失敗', error instanceof Error ? error.message : error);
    const message = error instanceof Error && error.message ? error.message : '客訴沒有送出，請稍後再試。';
    return json(500, { message });
  }
});

async function handle(req: Request): Promise<{ mailed: boolean; mailNotice: string }> {
  const raw = await req.text();
  if (raw.length > 20_000) {
    throw new ComplaintInputError('內容太長。');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new ComplaintInputError('客訴內容不正確。');
  }

  if (isAction(payload, 'sweep')) {
    return sweep(req);
  }

  if (isReply(payload)) {
    return handleReply(req, payload);
  }

  const mail = parseComplaint(payload);
  const admin = adminClient();
  const senderUid = await signedInUid(req, admin);

  const { data, error } = await admin
    .from('support_complaints')
    .insert({
      senderName: mail.senderName,
      senderEmail: mail.senderEmail,
      senderUid,
      category: mail.category,
      subject: mail.subject,
      body: mail.body,
      status: 'open',
    })
    .select('id, createdAt')
    .single();

  if (error || !data) {
    console.error('寫入客訴失敗', error?.message ?? '沒有回傳資料');
    throw new Error('客訴沒有寫入，請稍後再試。');
  }

  const row = data as { id: number; createdAt: string };
  const letter = complaintLetter({ ...mail, id: row.id, createdAt: row.createdAt, senderUid });

  try {
    await sendSupportCopy({ subject: letter.subject, text: letter.text, html: letter.html, replyTo: mail.senderEmail });
    return { mailed: true, mailNotice: '' };
  } catch (error) {
    console.error('客服信沒有寄出', error instanceof Error ? error.message : error);
    const detail = error instanceof MailConfigError ? error.message : '寄到客服信箱失敗。';
    const mailNotice = `客訴已記下，但沒有寄到客服信箱。${detail}不用再送一次。`;
    return { mailed: false, mailNotice };
  }
}

async function handleReply(req: Request, payload: unknown): Promise<{ mailed: boolean; mailNotice: string }> {
  const reply = parseReply(payload);
  const admin = adminClient();
  const uid = await signedInUid(req, admin);
  if (!uid) {
    throw new ComplaintInputError('請先以管理者身分登入再回覆。');
  }

  const role = await appRole(req);
  if (role !== 'admin') {
    throw new ComplaintInputError('只有管理者可以寄出客訴回覆。');
  }

  const { data, error } = await admin
    .from('support_complaints')
    .select('id, senderName, senderEmail, subject')
    .eq('id', reply.complaintId)
    .maybeSingle();

  if (error || !data) {
    console.error('讀取客訴失敗', error?.message ?? '沒有這筆客訴');
    throw new ComplaintInputError('找不到這筆客訴。');
  }

  const complaint = data as { id: number; senderName: string; senderEmail: string; subject: string };
  const letter = replyLetter({ ...complaint, body: reply.body, createdAt: new Date().toISOString() });

  try {
    await sendReplyCopy({
      to: complaint.senderEmail,
      toName: complaint.senderName,
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    });
    return { mailed: true, mailNotice: '' };
  } catch (error) {
    console.error('客訴回覆沒有寄出', error instanceof Error ? error.message : error);
    const detail = error instanceof MailConfigError ? error.message : '寄信失敗。';
    return { mailed: false, mailNotice: `回覆已記在客訴列表，但沒有寄進 Gmail。${detail}` };
  }
}

const REPLY_WAIT_MS = 7 * 24 * 60 * 60 * 1000;

async function sweep(req: Request): Promise<{ mailed: boolean; mailNotice: string }> {
  const admin = adminClient();
  const uid = await signedInUid(req, admin);
  if (!uid || (await appRole(req)) !== 'admin') {
    throw new ComplaintInputError('只有管理者可以結案。');
  }

  const deadline = new Date(Date.now() - REPLY_WAIT_MS).toISOString();
  const { data: due, error: dueError } = await admin
    .from('support_complaints')
    .select('id')
    .eq('status', 'replied')
    .lte('awaitingReplyAt', deadline);

  if (dueError) {
    console.error('讀取逾期客訴失敗', dueError.message);
    throw new Error('自動結案檢查失敗。');
  }

  const now = new Date().toISOString();
  for (const row of (due ?? []) as { id: number }[]) {
    const { error } = await admin
      .from('support_complaints')
      .update({ status: 'closed', closeMethod: 'auto', closedAt: now, updatedAt: now })
      .eq('id', row.id)
      .eq('status', 'replied');
    if (error) {
      console.error('自動結案失敗', error.message);
    }
  }

  const { data: pending, error: pendingError } = await admin
    .from('support_complaints')
    .select('id, senderName, senderEmail, senderUid, subject, closeMethod, closedAt')
    .eq('status', 'closed')
    .is('closeNotifiedAt', null);

  if (pendingError) {
    console.error('讀取待通知結案失敗', pendingError.message);
    throw new Error('結案通知檢查失敗。');
  }

  let failed = 0;
  for (const row of (pending ?? []) as {
    id: number;
    senderName: string;
    senderEmail: string;
    senderUid: string | null;
    subject: string;
    closeMethod: string | null;
    closedAt: string | null;
  }[]) {
    const closeMethod = row.closeMethod === 'auto' ? 'auto' : 'manual';
    const letter = closeLetter({
      id: row.id,
      subject: row.subject,
      senderName: row.senderName,
      closeMethod,
      closedAt: row.closedAt ?? now,
    });
    try {
      await sendReplyCopy({
        to: row.senderEmail,
        toName: row.senderName,
        subject: letter.subject,
        text: letter.text,
        html: letter.html,
      });
      if (row.senderUid) {
        const { error: inboxError } = await admin.from('member_messages').insert({
          recipientUid: row.senderUid,
          recipientName: row.senderName,
          senderUid: null,
          senderName: '平台客服',
          category: 'SYSTEM',
          subject: letter.subject,
          content: letter.text,
        });
        if (inboxError) {
          console.error('結案站內信沒有寫入', inboxError.message);
        }
      }
      const { error: markError } = await admin
        .from('support_complaints')
        .update({ closeNotifiedAt: new Date().toISOString() })
        .eq('id', row.id);
      if (markError) {
        console.error('結案通知時間沒有寫入', markError.message);
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      console.error('結案信沒有寄出', error instanceof Error ? error.message : error);
    }
  }

  return {
    mailed: failed === 0,
    mailNotice: failed === 0 ? '' : '有結案通知沒有寄出，下次打開這頁會再試。',
  };
}

function isAction(payload: unknown, action: string): boolean {
  return Boolean(payload && typeof payload === 'object' && (payload as { action?: string }).action === action);
}

function isReply(payload: unknown): boolean {
  return isAction(payload, 'reply');
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY');
  if (!url || !serviceKey) {
    throw new Error('寄信服務還沒有資料庫金鑰，客訴沒有寫入。');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function appRole(req: Request): Promise<string | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  const token = bearer(req);
  if (!url || !anonKey || !token) {
    return null;
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.rpc('current_app_role');
  if (error || typeof data !== 'string') {
    console.error('讀取身分失敗', error?.message ?? '沒有身分');
    return null;
  }

  return data;
}

function bearer(req: Request): string {
  return (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
}

async function signedInUid(req: Request, admin: ReturnType<typeof adminClient>): Promise<string | null> {
  const token = bearer(req);
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
