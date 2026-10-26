import { Injectable, inject } from '@angular/core';

import { supportCategoryLabel } from '../../content/support-contact';
import { SupabaseService } from '../database/supabase.service';
import { MemberMailDispatchService } from '../member-center/member-mail-dispatch.service';
import { MemberSessionService } from '../member-center/member-session.service';

export type ComplaintStatus = 'open' | 'replied' | 'closed';
export type ComplaintCloseMethod = 'manual' | 'auto';

export interface SupportComplaint {
  id: number;
  senderName: string;
  senderEmail: string;
  senderUid: string | null;
  category: string;
  subject: string;
  body: string;
  status: ComplaintStatus;
  awaitingReplyAt: string | null;
  closeMethod: ComplaintCloseMethod | null;
  closedAt: string | null;
  createdAt: string;
}

export interface SupportReply {
  id: number;
  complaintId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface SupportComplaintDraft {
  senderName: string;
  senderEmail: string;
  senderUid: string | null;
  category: string;
  body: string;
}

export interface SupportComplaintSubmitResult {
  mailed: boolean;
  mailNotice: string;
}

interface ComplaintRow {
  id: number;
  senderName: string;
  senderEmail: string;
  senderUid: string | null;
  category: string;
  subject: string;
  body: string;
  status: string;
  awaitingReplyAt: string | null;
  closeMethod: string | null;
  closedAt: string | null;
  createdAt: string;
}

interface ReplyRow {
  id: number;
  complaintId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupportComplaintService {
  private readonly supabase = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);
  private readonly mail = inject(MemberMailDispatchService);

  async submit(draft: SupportComplaintDraft): Promise<SupportComplaintSubmitResult> {
    const { data, error } = await this.supabase.client.functions.invoke('notify-support-complaint', {
      body: {
        senderName: draft.senderName.trim(),
        senderEmail: draft.senderEmail.trim(),
        category: draft.category,
        body: draft.body.trim(),
      },
    });

    if (error) {
      const described = await this.describeInvokeError(error);
      if (described.missing) {
        await this.insertComplaint(draft);
        return {
          mailed: false,
          mailNotice: '客訴已記下。寄信功能還沒部署，所以沒有寄到客服信箱。不用再送一次。',
        };
      }

      console.error('送出客訴失敗：', error);
      throw new Error(described.message);
    }

    const result = (data ?? {}) as { mailed?: boolean; mailNotice?: string };
    const mailed = result.mailed === true;
    return {
      mailed,
      mailNotice: mailed ? '' : result.mailNotice?.trim() || '客訴已記下，但沒有寄到客服信箱。不用再送一次。',
    };
  }

  async list(): Promise<SupportComplaint[]> {
    const { error: sweepError } = await this.supabase.client.functions.invoke('notify-support-complaint', {
      body: { action: 'sweep' },
    });
    if (sweepError) {
      console.error('自動結案檢查失敗：', sweepError);
    }

    const { data, error } = await this.supabase.client
      .from('support_complaints')
      .select('id, senderName, senderEmail, senderUid, category, subject, body, status, awaitingReplyAt, closeMethod, closedAt, createdAt')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('讀取客訴失敗：', error);
      throw error;
    }

    return ((data ?? []) as ComplaintRow[]).map((row) => this.mapComplaint(row));
  }

  async replies(complaintId: number): Promise<SupportReply[]> {
    const { data, error } = await this.supabase.client
      .from('support_replies')
      .select('id, complaintId, authorName, body, createdAt')
      .eq('complaintId', complaintId)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('讀取客訴回覆失敗：', error);
      throw error;
    }

    return ((data ?? []) as ReplyRow[]).map((row) => ({
      id: row.id,
      complaintId: row.complaintId,
      authorName: row.authorName,
      body: row.body,
      createdAt: row.createdAt,
    }));
  }

  async reply(complaint: SupportComplaint, body: string): Promise<SupportComplaintSubmitResult> {
    const text = body.trim();
    const authorUid = await this.session.getCurrentUid();
    const authorName = '平台客服';

    const { error } = await this.supabase.client.from('support_replies').insert({
      complaintId: complaint.id,
      authorUid,
      authorName,
      body: text,
    });

    if (error) {
      console.error('回覆客訴失敗：', error);
      throw error;
    }

    const recipientUid = complaint.senderUid ?? (await this.findDonorUid(complaint.senderEmail));
    if (recipientUid) {
      const { error: inboxError } = await this.supabase.client.from('member_messages').insert({
        recipientUid,
        recipientName: complaint.senderName,
        senderUid: authorUid,
        senderName: authorName,
        category: 'SYSTEM',
        subject: `回覆：${complaint.subject}`,
        content: text,
      });

      if (inboxError) {
        console.error('客訴回覆已保存，但沒有寫入會員收件匣：', inboxError);
      } else {
        void this.mail.sweep();
      }
    }

    const now = new Date().toISOString();
    const { error: waitingError } = await this.supabase.client
      .from('support_complaints')
      .update({
        status: 'replied',
        awaitingReplyAt: now,
        closeMethod: null,
        closedAt: null,
        closeNotifiedAt: null,
        updatedAt: now,
      })
      .eq('id', complaint.id);

    if (waitingError) {
      console.error('回覆已保存，但沒有開始七天等待：', waitingError);
      throw new Error('回覆已記下，但等待結案的時間沒有寫入。');
    }

    const { data, error: mailError } = await this.supabase.client.functions.invoke('notify-support-complaint', {
      body: { action: 'reply', complaintId: complaint.id, body: text },
    });
    if (mailError) {
      console.error('客訴回覆已保存，但沒有寄進 Gmail：', mailError);
      return { mailed: false, mailNotice: '回覆已記在客訴列表，但沒有寄進 Gmail。' };
    }

    const result = (data ?? {}) as { mailed?: boolean; mailNotice?: string };
    const mailed = result.mailed === true;
    return {
      mailed,
      mailNotice: mailed ? '' : result.mailNotice?.trim() || '回覆已記在客訴列表，但沒有寄進 Gmail。',
    };
  }

  async closeManually(id: number): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.supabase.client
      .from('support_complaints')
      .update({
        status: 'closed',
        closeMethod: 'manual',
        closedAt: now,
        closeNotifiedAt: null,
        updatedAt: now,
      })
      .eq('id', id);

    if (error) {
      console.error('手動結案失敗：', error);
      throw new Error('沒有結案，請稍後再試。');
    }
  }

  async reopen(id: number): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.supabase.client
      .from('support_complaints')
      .update({
        status: 'open',
        awaitingReplyAt: null,
        closeMethod: null,
        closedAt: null,
        closeNotifiedAt: null,
        updatedAt: now,
      })
      .eq('id', id);

    if (error) {
      console.error('重新開啟客訴失敗：', error);
      throw new Error('沒有重新開啟，請稍後再試。');
    }
  }

  async markSenderReplied(id: number): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.supabase.client
      .from('support_complaints')
      .update({
        status: 'open',
        awaitingReplyAt: null,
        closeMethod: null,
        closedAt: null,
        closeNotifiedAt: null,
        updatedAt: now,
      })
      .eq('id', id);

    if (error) {
      console.error('改回未處理失敗：', error);
      throw new Error('沒有改回未處理，請稍後再試。');
    }
  }

  private async insertComplaint(draft: SupportComplaintDraft): Promise<void> {
    const senderName = draft.senderName.trim();
    const senderEmail = draft.senderEmail.trim();
    const body = draft.body.trim();
    const subject = supportCategoryLabel(draft.category);

    const { error } = await this.supabase.client.from('support_complaints').insert({
      senderName,
      senderEmail,
      senderUid: draft.senderUid,
      category: draft.category,
      subject,
      body,
      status: 'open',
    });

    if (error) {
      console.error('送出客訴失敗：', error);
      throw new Error('訊息沒有送出，請稍後再試，或直接寄信到客服信箱。');
    }
  }

  private async describeInvokeError(error: unknown): Promise<{ missing: boolean; message: string }> {
    const fallback = '訊息沒有送出，請稍後再試，或直接寄信到客服信箱。';
    const context = error && typeof error === 'object' && 'context' in error ? (error as { context?: unknown }).context : null;
    if (!(context instanceof Response)) {
      return { missing: false, message: fallback };
    }

    const missing = context.status === 404;
    try {
      const body = (await context.clone().json()) as { message?: unknown };
      if (typeof body.message === 'string' && /[\u4e00-\u9fff]/.test(body.message)) {
        return { missing, message: body.message.trim() };
      }
    } catch {
      // 平台沒有回我們的 JSON
    }

    return { missing, message: fallback };
  }

  private async findDonorUid(email: string): Promise<string | null> {
    const trimmed = email.trim();
    if (!trimmed) {
      return null;
    }

    const { data, error } = await this.supabase.client.from('donor_profiles').select('uid').eq('email', trimmed).maybeSingle();
    if (error || !data) {
      return null;
    }

    return String((data as { uid?: string }).uid ?? '') || null;
  }

  private mapComplaint(row: ComplaintRow): SupportComplaint {
    const status = row.status === 'replied' || row.status === 'closed' ? row.status : 'open';
    const closeMethod = row.closeMethod === 'manual' || row.closeMethod === 'auto' ? row.closeMethod : null;
    return {
      id: row.id,
      senderName: row.senderName,
      senderEmail: row.senderEmail,
      senderUid: row.senderUid,
      category: row.category,
      subject: row.subject,
      body: row.body,
      status,
      awaitingReplyAt: row.awaitingReplyAt,
      closeMethod: status === 'closed' ? closeMethod || 'manual' : null,
      closedAt: row.closedAt,
      createdAt: row.createdAt,
    };
  }
}
