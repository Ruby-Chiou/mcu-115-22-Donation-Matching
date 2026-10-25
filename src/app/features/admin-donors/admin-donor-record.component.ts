import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DonorAccountAdminService, DonorAccountRecord } from '../../core/services/admin/donor-account-admin.service';
import { DonorActivityItem, DonorActivityKind, DonorDeskService } from '../../core/services/admin/donor-desk.service';

const KIND_LABELS: Record<DonorActivityKind, string> = {
  donation: '捐助',
  thank: '感謝',
  receipt: '收據',
  certificate: '感謝狀',
  message: '站內信',
};

const DONATION_STATUSES = [
  { value: 'pending_ai_review', label: '等待系統審核' },
  { value: 'pending_human_review', label: '等待機構審核' },
  { value: 'human_approved', label: '審核通過' },
  { value: 'human_rejected', label: '未通過' },
];

@Component({
  selector: 'app-admin-donor-record',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin-donor-record.component.html',
  styleUrl: '../admin-desk.scss',
})
/** 單筆捐助、感謝、收據、感謝狀或站內信的處理頁。 */
export class AdminDonorRecordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly accounts = inject(DonorAccountAdminService);
  private readonly desk = inject(DonorDeskService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notice = signal('');
  protected readonly noticeError = signal(false);
  protected readonly donor = signal<DonorAccountRecord | null>(null);
  protected readonly record = signal<DonorActivityItem | null>(null);
  protected readonly donationStatuses = DONATION_STATUSES;
  protected repair: Record<string, string> = {};
  protected replySubject = '';
  protected replyBody = '';

  async ngOnInit(): Promise<void> {
    const uid = this.route.snapshot.paramMap.get('uid') ?? '';
    const kind = this.route.snapshot.paramMap.get('kind') ?? '';
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    try {
      const donors = await this.accounts.list();
      const donor = donors.find((item) => item.uid === uid) ?? null;
      this.donor.set(donor);

      if (!donor || !this.isKind(kind)) {
        return;
      }

      const activity = await this.desk.activity(donor.uid);
      const record = activity.items.find((item) => item.kind === kind && item.id === id) ?? null;
      this.record.set(record);
      if (record) {
        this.repair = { ...record.fields };
        this.replySubject = record.fields['subject'] ? `回覆：${record.fields['subject']}` : '';
      }
    } catch (error) {
      console.error(error);
      this.show('這筆紀錄讀取失敗。', true);
    } finally {
      this.loading.set(false);
    }
  }

  protected kindLabel(kind: DonorActivityKind): string {
    return KIND_LABELS[kind];
  }

  protected async save(): Promise<void> {
    const record = this.record();
    const donor = this.donor();
    if (!record || !donor || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.notice.set('');
    try {
      if (record.kind === 'donation') {
        await this.desk.repairDonation(record.id, this.repair);
      } else if (record.kind === 'thank') {
        await this.desk.repairThank(record.id, this.repair);
      } else if (record.kind === 'receipt') {
        await this.desk.repairReceipt(record.id, this.repair);
      } else if (record.kind === 'certificate') {
        await this.desk.repairCertificate(record.id, this.repair);
      }
      await this.reloadRecord(donor.uid, record.kind, record.id);
      this.show('這筆紀錄已更新。', false);
    } catch (error) {
      console.error(error);
      this.show('這筆紀錄沒有更新。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async sendReply(): Promise<void> {
    const donor = this.donor();
    if (!donor || this.saving()) {
      return;
    }

    if (!this.replySubject.trim() || !this.replyBody.trim()) {
      this.show('請填主旨和內容。', true);
      return;
    }

    this.saving.set(true);
    this.notice.set('');
    try {
      await this.desk.sendMessage(donor, this.replySubject, this.replyBody);
      this.replyBody = '';
      this.show('回覆已送到對方的會員收件匣。', false);
    } catch (error) {
      console.error(error);
      this.show('回覆沒有送出。', true);
    } finally {
      this.saving.set(false);
    }
  }

  private async reloadRecord(uid: string, kind: DonorActivityKind, id: string): Promise<void> {
    const activity = await this.desk.activity(uid);
    const record = activity.items.find((item) => item.kind === kind && item.id === id) ?? null;
    this.record.set(record);
    if (record) {
      this.repair = { ...record.fields };
    }
  }

  private isKind(value: string): value is DonorActivityKind {
    return value in KIND_LABELS;
  }

  private show(message: string, error: boolean): void {
    this.notice.set(message);
    this.noticeError.set(error);
  }
}
