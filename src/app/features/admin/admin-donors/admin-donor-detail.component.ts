import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BoardAnnouncement, BoardName } from '../../../core/services/admin/board-announcement.service';
import {
  DonorAccountAdminService,
  DonorAccountRecord,
  DonorAdminStatus,
} from '../../../core/services/admin/donor-account-admin.service';
import { DonorActivity, DonorActivityItem, DonorActivityKind, DonorDeskService } from '../../../core/services/admin/donor-desk.service';

type DonorPanel = 'activity' | 'message' | 'thank' | 'blacklist';

const ACTIVITY_KINDS: { id: 'all' | DonorActivityKind; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'donation', label: '捐助' },
  { id: 'thank', label: '感謝' },
  { id: 'receipt', label: '收據' },
  { id: 'certificate', label: '感謝狀' },
  { id: 'message', label: '站內信' },
];

@Component({
  selector: 'app-admin-donor-detail',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin-donor-detail.component.html',
  styleUrl: './admin-donor-detail.component.scss',
})
/** 單一捐助者的資料、動態、私訊、感謝牆與黑名單。 */
export class AdminDonorDetailComponent implements OnInit {
  private readonly accounts = inject(DonorAccountAdminService);
  private readonly desk = inject(DonorDeskService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal('');
  protected readonly noticeError = signal(false);
  protected readonly donor = signal<DonorAccountRecord | null>(null);
  protected readonly marks = signal(new Map<string, { thank: boolean; blacklist: boolean }>());
  protected readonly panel = signal<DonorPanel>('activity');
  protected readonly publicBlacklist = signal<BoardAnnouncement[]>([]);
  protected readonly activity = signal<DonorActivity | null>(null);
  protected readonly activityLoading = signal(false);
  protected readonly activityKinds = ACTIVITY_KINDS;
  protected activityQuery = '';
  protected activityKind: 'all' | DonorActivityKind = 'all';
  protected boardHeadline = '';
  protected boardBody = '';
  protected messageSubject = '';
  protected messageBody = '';

  async ngOnInit(): Promise<void> {
    const uid = this.route.snapshot.paramMap.get('uid') ?? '';
    try {
      const [donors, marks] = await Promise.all([this.accounts.list(), this.desk.boardMarks()]);
      this.marks.set(marks);
      const donor = donors.find((item) => item.uid === uid) ?? null;
      this.donor.set(donor);
      if (donor) {
        await this.loadActivity(donor);
      }
    } catch (error) {
      console.error(error);
      this.show('這位捐助者讀取失敗。', true);
    } finally {
      this.loading.set(false);
    }
  }

  protected statusLabel(status: DonorAdminStatus): string {
    if (status === 'SUSPENDED') {
      return '已停用';
    }
    if (status === 'DELETED') {
      return '已註銷';
    }
    return '使用中';
  }

  protected kindLabel(kind: DonorAccountRecord['donorKind']): string {
    if (kind === 'company') {
      return '企業';
    }
    if (kind === 'individual') {
      return '個人';
    }
    return '未標記';
  }

  protected mark(uid: string): { thank: boolean; blacklist: boolean } {
    return this.marks().get(uid) ?? { thank: false, blacklist: false };
  }

  protected async showPanel(next: DonorPanel): Promise<void> {
    const donor = this.donor();
    if (!donor) {
      return;
    }

    this.panel.set(next);
    this.notice.set('');

    if (next === 'activity') {
      await this.loadActivity(donor);
      return;
    }

    if (next === 'thank' || next === 'blacklist') {
      await this.prepareBoard(donor, next === 'thank' ? 'thank_wall' : 'blacklist');
    }

    if (next === 'blacklist') {
      await this.reloadPublicBlacklist();
    }
  }

  protected async setStatus(status: DonorAdminStatus): Promise<void> {
    const donor = this.donor();
    if (!donor || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.notice.set('');

    try {
      await this.accounts.setStatus(donor, status);
      const donors = await this.accounts.list();
      this.donor.set(donors.find((item) => item.uid === donor.uid) ?? donor);
      this.show(
        status === 'ACTIVE' ? '已恢復這個捐助帳號。' : status === 'DELETED' ? '已註銷這個捐助帳號，對方將無法登入。' : '已停用這個捐助帳號，對方將無法登入。',
        false,
      );
    } catch (error) {
      console.error(error);
      this.show('帳號狀態沒有更新，請稍後再試。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async cancelAccount(): Promise<void> {
    const donor = this.donor();
    if (!donor || this.saving()) {
      return;
    }

    const confirmed = window.confirm(`確定要註銷「${donor.displayName || donor.email}」？註銷後對方無法登入，此操作可再改回使用中。`);
    if (!confirmed) {
      return;
    }

    await this.setStatus('DELETED');
  }

  protected async saveBoard(board: BoardName): Promise<void> {
    const donor = this.donor();
    if (!donor || this.saving()) {
      return;
    }

    if (!this.boardHeadline.trim() || !this.boardBody.trim()) {
      this.show(board === 'blacklist' ? '請填公開顯示名稱和原因。' : '請填公開名稱和捐贈內容。', true);
      return;
    }

    this.saving.set(true);
    try {
      if (board === 'thank_wall') {
        await this.desk.publishThankCard(donor, this.boardHeadline, this.boardBody);
      } else {
        await this.desk.saveBoard(donor, board, this.boardHeadline, this.boardBody);
        await this.reloadPublicBlacklist();
      }
      this.marks.set(await this.desk.boardMarks());
      this.show(
        board === 'blacklist' ? '已加進公開頁右側的捐助者黑名單。' : '已在公開感謝牆加上這位捐助者的感謝卡。',
        false,
      );
    } catch (error) {
      console.error(error);
      this.show('沒有儲存，請稍後再試。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async clearBoard(board: BoardName): Promise<void> {
    const donor = this.donor();
    if (!donor || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      await this.desk.clearBoard(donor.uid, board);
      this.boardBody = '';
      this.marks.set(await this.desk.boardMarks());
      if (board === 'blacklist') {
        await this.reloadPublicBlacklist();
      }
      this.show(board === 'blacklist' ? '已從黑名單移除。' : '已從感謝牆移除。', false);
    } catch (error) {
      console.error(error);
      this.show('沒有移除。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async sendMessage(): Promise<void> {
    const donor = this.donor();
    if (!donor || this.saving()) {
      return;
    }

    if (!this.messageSubject.trim() || !this.messageBody.trim()) {
      this.show('請填主旨和內容。', true);
      return;
    }

    this.saving.set(true);
    try {
      await this.desk.sendMessage(donor, this.messageSubject, this.messageBody);
      this.messageSubject = '';
      this.messageBody = '';
      this.show('已送到對方的會員收件匣。', false);
    } catch (error) {
      console.error(error);
      this.show('私訊沒有送出。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected visibleActivity(): DonorActivityItem[] {
    const keyword = this.activityQuery.trim().toLowerCase();
    return (this.activity()?.items ?? []).filter((item) => {
      if (this.activityKind !== 'all' && item.kind !== this.activityKind) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const text = `${item.title} ${item.detail} ${Object.values(item.fields).join(' ')}`.toLowerCase();
      return text.includes(keyword);
    });
  }

  protected activityKindLabel(kind: DonorActivityKind): string {
    return this.activityKinds.find((item) => item.id === kind)?.label ?? '紀錄';
  }

  private async reloadPublicBlacklist(): Promise<void> {
    try {
      this.publicBlacklist.set(await this.desk.publicDonorBlacklist());
    } catch (error) {
      console.error(error);
      this.publicBlacklist.set([]);
    }
  }

  private async prepareBoard(donor: DonorAccountRecord, board: BoardName): Promise<void> {
    this.boardHeadline = board === 'thank_wall' ? donor.displayName || donor.fullName || '捐助者' : this.desk.maskName(donor);
    this.boardBody = '';

    try {
      if (board === 'thank_wall') {
        const card = await this.desk.adminThank(donor.uid);
        if (card) {
          this.boardHeadline = card.displayName || this.boardHeadline;
          this.boardBody = card.donationItem;
        }
        return;
      }

      const existing = await this.desk.boardEntry(donor.uid, board);
      if (existing) {
        this.boardHeadline = existing.headline || this.desk.maskName(donor);
        this.boardBody = existing.body;
      }
    } catch (error) {
      console.error(error);
      this.show('這位捐助者的公開狀態讀取失敗。', true);
    }
  }

  private async loadActivity(donor: DonorAccountRecord): Promise<void> {
    this.activityLoading.set(true);
    try {
      this.activity.set(await this.desk.activity(donor.uid));
    } catch (error) {
      console.error(error);
      this.show('動態讀取失敗。', true);
    } finally {
      this.activityLoading.set(false);
    }
  }

  private show(message: string, error: boolean): void {
    this.notice.set(message);
    this.noticeError.set(error);
  }
}
