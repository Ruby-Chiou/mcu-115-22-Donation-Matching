import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PlatformAnnouncementRecord,
  PlatformAnnouncementService,
} from '../../core/services/admin/platform-announcement.service';

@Component({
  selector: 'app-admin-announcements',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-announcements.component.html',
  styleUrl: '../admin-desk.scss',
})
export class AdminAnnouncementsComponent implements OnInit {
  private readonly announcements = inject(PlatformAnnouncementService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal('');
  protected readonly noticeError = signal(false);
  protected readonly items = signal<PlatformAnnouncementRecord[]>([]);
  protected editingId: number | null = null;
  protected body = '';
  protected publishNow = true;

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  protected edit(item: PlatformAnnouncementRecord): void {
    this.editingId = item.id;
    this.body = item.body;
    this.publishNow = item.published;
    this.notice.set('');
  }

  protected resetForm(): void {
    this.editingId = null;
    this.body = '';
    this.publishNow = true;
  }

  protected async save(): Promise<void> {
    if (!this.body.trim() || this.saving()) {
      this.show('請先寫公告內容。', true);
      return;
    }

    this.saving.set(true);
    try {
      await this.announcements.save({
        id: this.editingId ?? undefined,
        body: this.body,
        published: this.publishNow,
      });
      this.resetForm();
      await this.reload();
      this.show(this.publishNow ? '公告已發布，首頁與機構總控台會看得到。' : '公告已存成草稿。', false);
    } catch (error) {
      console.error(error);
      this.show('公告沒有儲存，請稍後再試。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggle(item: PlatformAnnouncementRecord): Promise<void> {
    try {
      await this.announcements.setPublished(item, !item.published);
      await this.reload();
      this.show(item.published ? '已收回這則公告。' : '已重新發布這則公告。', false);
    } catch (error) {
      console.error(error);
      this.show('發布狀態沒有更新。', true);
    }
  }

  protected async remove(item: PlatformAnnouncementRecord): Promise<void> {
    if (!window.confirm('確定刪除這則系統公告？')) {
      return;
    }

    try {
      await this.announcements.remove(item.id);
      if (this.editingId === item.id) {
        this.resetForm();
      }
      await this.reload();
      this.show('已刪除公告。', false);
    } catch (error) {
      console.error(error);
      this.show('公告沒有刪除。', true);
    }
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await this.announcements.listAll());
    } catch (error) {
      console.error(error);
      this.show('系統公告讀取失敗。', true);
    } finally {
      this.loading.set(false);
    }
  }

  private show(message: string, error: boolean): void {
    this.notice.set(message);
    this.noticeError.set(error);
  }
}
