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
  private nextMockMessageId = -5;

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
    const mockMessages = this.createMockInboxMessages(uid);
    this.inboxSignal.set(mockMessages);

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
    const inboxMessages = [...mockMessages, ...messages];
    this.inboxSignal.set(inboxMessages);

    return inboxMessages;
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
    if (message.id < 0) {
      const target = folder === 'inbox' ? this.inboxSignal : this.sentSignal;
      target.update((messages) => messages.filter((item) => item.id !== message.id));
      return;
    }

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

    if (payload.recipientUid.startsWith('mock-agency-')) {
      const message: MemberMessage = {
        id: this.nextMockMessageId--,
        recipientUid: payload.recipientUid,
        recipientName: payload.recipientName,
        senderUid: uid,
        senderName: profile.displayName,
        category: 'AGENCY',
        subject: payload.subject.trim(),
        content: payload.content.trim(),
        parentId: payload.parentId ?? null,
        isRead: true,
        isStarred: false,
        createdAt: new Date().toISOString(),
      };
      this.sentSignal.update((messages) => [message, ...messages]);

      return message;
    }

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
    if (id < 0) {
      this.inboxSignal.update((messages) => messages.map((item) => (item.id === id ? { ...item, ...flags } : item)));
      return;
    }

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

  private createMockInboxMessages(recipientUid: string): MemberMessage[] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    return [
      {
        id: -1,
        recipientUid,
        recipientName: '會員',
        senderUid: null,
        senderName: '公益媒合平台',
        category: 'SYSTEM',
        subject: '歡迎使用公益媒合平台',
        content: '您好，歡迎加入公益媒合平台！您可以在平台上瀏覽捐贈需求、追蹤捐贈進度，並與公益機構聯繫。',
        parentId: null,
        isRead: false,
        isStarred: false,
        createdAt: new Date(now - day).toISOString(),
      },
      {
        id: -2,
        recipientUid,
        recipientName: '會員',
        senderUid: 'mock-agency-sunshine',
        senderName: '陽光關懷協會',
        category: 'AGENCY',
        subject: '感謝您關注我們的物資需求',
        content: '您好，感謝您關注本會的物資需求。若您想進一步了解物資規格或捐贈方式，歡迎直接回覆這封信。',
        parentId: null,
        isRead: false,
        isStarred: true,
        createdAt: new Date(now - 2 * day).toISOString(),
      },
      {
        id: -3,
        recipientUid,
        recipientName: '會員',
        senderUid: null,
        senderName: '公益媒合平台',
        category: 'DONATION',
        subject: '您的捐贈已送達合作機構',
        content: '您支持的生活物資已由合作機構簽收。謝謝您的善意，讓需要幫助的人獲得即時支持。',
        parentId: null,
        isRead: true,
        isStarred: false,
        createdAt: new Date(now - 4 * day).toISOString(),
      },
      {
        id: -4,
        recipientUid,
        recipientName: '會員',
        senderUid: 'mock-agency-harbor',
        senderName: '暖心港灣基金會',
        category: 'AGENCY',
        subject: '本月捐贈物資需求更新',
        content: '您好，本月服務家庭的民生用品需求已更新。您可至平台查看最新需求清單，謝謝您的支持。',
        parentId: null,
        isRead: true,
        isStarred: false,
        createdAt: new Date(now - 6 * day).toISOString(),
      },
    ];
  }
}
