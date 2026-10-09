import { Injectable, computed, inject, signal } from '@angular/core';

import { MemberMessage, MessageCategory, MessageContact, MessageFolder, SendMessagePayload } from '../../../models/member/member-message';
import { SupabaseService } from '../database/supabase.service';
import { MemberProfileService } from './member-profile.service';
import { MemberSessionService } from './member-session.service';

interface MemberMessageRow {
  id: number | string;
  recipientUid: string;
  recipientName: string | null;
  senderUid: string | null;
  senderName: string | null;
  category: string | null;
  subject: string | null;
  content: string | null;
  parentId: number | string | null;
  isRead: boolean | null;
  isStarred: boolean | null;
  createdAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MemberMessageService {
  private readonly tableName = 'member_messages';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);
  private readonly profileService = inject(MemberProfileService);

  private readonly inboxSignal = signal<MemberMessage[]>([]);
  private readonly sentSignal = signal<MemberMessage[]>([]);

  readonly inbox = this.inboxSignal.asReadonly();
  readonly sent = this.sentSignal.asReadonly();
  readonly unreadCount = computed(() => this.inboxSignal().filter((message) => !message.isRead).length);

  /** 可寄信的對象：曾來信或曾寄信過的機構 */
  readonly contacts = computed<MessageContact[]>(() => {
    const contactMap = new Map<string, string>();

    for (const message of this.inboxSignal()) {
      if (message.category === 'AGENCY' && message.senderUid) {
        contactMap.set(message.senderUid, message.senderName);
      }
    }

    for (const message of this.sentSignal()) {
      contactMap.set(message.recipientUid, message.recipientName);
    }

    return [...contactMap].map(([uid, name]) => ({ uid, name }));
  });

  async loadAll(): Promise<void> {
    await Promise.all([this.loadInbox(), this.loadSent()]);
  }

  async loadInbox(): Promise<MemberMessage[]> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('recipientUid', uid)
      .eq('recipientDeleted', false)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('讀取收件匣失敗：', error);
      throw error;
    }

    const messages = (data ?? []).map((row) => this.mapRowToMessage(row as MemberMessageRow));
    this.inboxSignal.set(messages);

    return messages;
  }

  async loadSent(): Promise<MemberMessage[]> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('senderUid', uid)
      .eq('senderDeleted', false)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('讀取寄件備份失敗：', error);
      throw error;
    }

    const messages = (data ?? []).map((row) => this.mapRowToMessage(row as MemberMessageRow));
    this.sentSignal.set(messages);

    return messages;
  }

  async markAsRead(message: MemberMessage): Promise<void> {
    if (message.isRead) {
      return;
    }

    await this.updateInboxFlags(message.id, { isRead: true });
  }

  async toggleStar(message: MemberMessage): Promise<void> {
    await this.updateInboxFlags(message.id, { isStarred: !message.isStarred });
  }

  async deleteMessage(message: MemberMessage, folder: MessageFolder): Promise<void> {
    const column = folder === 'inbox' ? 'recipientDeleted' : 'senderDeleted';

    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .update({ [column]: true })
      .eq('id', message.id);

    if (error) {
      console.error('刪除信件失敗：', error);
      throw error;
    }

    const target = folder === 'inbox' ? this.inboxSignal : this.sentSignal;
    target.update((messages) => messages.filter((item) => item.id !== message.id));
  }

  async sendMessage(payload: SendMessagePayload): Promise<MemberMessage> {
    const uid = await this.session.getCurrentUid();
    const profile = this.profileService.profile() ?? (await this.profileService.loadProfile());

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .insert({
        recipientUid: payload.recipientUid,
        recipientName: payload.recipientName,
        senderUid: uid,
        senderName: profile.displayName,
        category: 'AGENCY',
        subject: payload.subject.trim(),
        content: payload.content.trim(),
        parentId: payload.parentId ?? null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('寄送信件失敗：', error);
      throw error;
    }

    const message = this.mapRowToMessage(data as MemberMessageRow);
    this.sentSignal.update((messages) => [message, ...messages]);

    return message;
  }

  private async updateInboxFlags(id: number, flags: Partial<Pick<MemberMessage, 'isRead' | 'isStarred'>>): Promise<void> {
    const { error } = await this.supabaseService.client.from(this.tableName).update(flags).eq('id', id);

    if (error) {
      console.error('更新信件狀態失敗：', error);
      throw error;
    }

    this.inboxSignal.update((messages) => messages.map((item) => (item.id === id ? { ...item, ...flags } : item)));
  }

  private mapRowToMessage(row: MemberMessageRow): MemberMessage {
    return {
      id: Number(row.id),
      recipientUid: row.recipientUid,
      recipientName: row.recipientName ?? '',
      senderUid: row.senderUid,
      senderName: row.senderName ?? '',
      category: (row.category ?? 'SYSTEM') as MessageCategory,
      subject: row.subject ?? '',
      content: row.content ?? '',
      parentId: row.parentId == null ? null : Number(row.parentId),
      isRead: row.isRead ?? false,
      isStarred: row.isStarred ?? false,
      createdAt: row.createdAt ?? '',
    };
  }
}
