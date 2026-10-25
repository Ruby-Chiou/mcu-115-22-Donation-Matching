import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SUPPORT_EMAIL, supportCategoryLabel } from '../../core/content/support-contact';
import { SupportComplaint, SupportComplaintService, SupportReply } from '../../core/services/admin/support-complaint.service';

@Component({
  selector: 'app-admin-complaint-desk',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-complaint-desk.component.html',
  styleUrl: '../admin-desk.scss',
})
export class AdminComplaintDeskComponent implements OnInit {
  private readonly complaints = inject(SupportComplaintService);

  protected readonly supportEmail = SUPPORT_EMAIL;
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal('');
  protected readonly noticeError = signal(false);
  protected readonly items = signal<SupportComplaint[]>([]);
  protected readonly selected = signal<SupportComplaint | null>(null);
  protected readonly replies = signal<SupportReply[]>([]);
  protected readonly view = signal<'open' | 'waiting' | 'manual' | 'auto'>('open');
  protected replyBody = '';

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  protected openItems(): SupportComplaint[] {
    return this.items().filter((item) => item.status === 'open');
  }

  protected waitingItems(): SupportComplaint[] {
    return this.items().filter((item) => item.status === 'replied');
  }

  protected manualItems(): SupportComplaint[] {
    return this.items().filter((item) => item.status === 'closed' && item.closeMethod !== 'auto');
  }

  protected autoItems(): SupportComplaint[] {
    return this.items().filter((item) => item.status === 'closed' && item.closeMethod === 'auto');
  }

  protected visible(): SupportComplaint[] {
    const view = this.view();
    if (view === 'waiting') {
      return this.waitingItems();
    }
    if (view === 'manual') {
      return this.manualItems();
    }
    if (view === 'auto') {
      return this.autoItems();
    }
    return this.openItems();
  }

  protected replyDeadline(item: SupportComplaint): Date | null {
    if (!item.awaitingReplyAt) {
      return null;
    }
    return new Date(new Date(item.awaitingReplyAt).getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  protected categoryLabel(value: string): string {
    return supportCategoryLabel(value);
  }

  protected async open(item: SupportComplaint): Promise<void> {
    this.selected.set(item);
    this.replyBody = '';
    this.notice.set('');
    try {
      this.replies.set(await this.complaints.replies(item.id));
    } catch (error) {
      console.error(error);
      this.replies.set([]);
      this.show('這封客訴的回覆讀取失敗。', true);
    }
  }

  protected async sendReply(): Promise<void> {
    const item = this.selected();
    if (!item || !this.replyBody.trim() || this.saving()) {
      this.show('請先寫回覆內容。', true);
      return;
    }

    this.saving.set(true);
    try {
      const result = await this.complaints.reply(item, this.replyBody);
      this.replyBody = '';
      await this.reload();
      const next = this.items().find((entry) => entry.id === item.id) ?? null;
      this.selected.set(next);
      this.replies.set(next ? await this.complaints.replies(next.id) : []);
      this.view.set('waiting');
      this.show(
        result.mailed ? '已回覆，案件仍未結案，改列在「待對方回覆」。七天內對方沒再回覆就會自動結案。' : result.mailNotice,
        !result.mailed
      );
    } catch (error) {
      console.error(error);
      this.show(error instanceof Error && error.message ? error.message : '回覆沒有送出，請稍後再試。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async markSenderReplied(): Promise<void> {
    const item = this.selected();
    if (!item || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      await this.complaints.markSenderReplied(item.id);
      await this.reload();
      this.selected.set(this.items().find((entry) => entry.id === item.id) ?? null);
      this.view.set('open');
      this.show('已改回未處理。七天自動結案的計時已取消。', false);
    } catch (error) {
      console.error(error);
      this.show(error instanceof Error && error.message ? error.message : '沒有改回未處理。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async closeSelected(): Promise<void> {
    const item = this.selected();
    if (!item || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      if (item.status === 'closed') {
        await this.complaints.reopen(item.id);
        await this.reload();
        this.selected.set(this.items().find((entry) => entry.id === item.id) ?? null);
        this.view.set('open');
        this.show('已重新開啟，回到未處理。', false);
        return;
      }

      await this.complaints.closeManually(item.id);
      await this.reload();
      this.selected.set(this.items().find((entry) => entry.id === item.id) ?? null);
      this.view.set('manual');
      this.show('已手動結案，並通知來信者與客服信箱。', false);
    } catch (error) {
      console.error(error);
      this.show(error instanceof Error && error.message ? error.message : '狀態沒有更新。', true);
    } finally {
      this.saving.set(false);
    }
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await this.complaints.list());
    } catch (error) {
      console.error(error);
      this.show('客訴信件讀取失敗。', true);
    } finally {
      this.loading.set(false);
    }
  }

  private show(message: string, error: boolean): void {
    this.notice.set(message);
    this.noticeError.set(error);
  }
}
