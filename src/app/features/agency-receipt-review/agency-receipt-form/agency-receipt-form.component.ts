import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ReceiptLineEditorComponent } from '../../../components/receipt/receipt-line-editor/receipt-line-editor.component';
import { emptyReceiptLine } from '../../../core/receipt/donation-receipt-document';
import { isTaiwanId, maskTaiwanId, normalizeTaiwanId } from '../../../core/receipt/taiwan-id';
import { AgencyReceiptIssuanceService } from '../../../core/services/agency/agency-receipt-issuance.service';
import { DonationRecordLinksComponent } from '../../agency-record-links/donation-record-links.component';
import { AgencyReceiptTask, RECEIPT_CARRIERS, ReceiptDraft } from '../../../models/agency/receipt-issuance';

@Component({
  selector: 'app-agency-receipt-form',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, ReceiptLineEditorComponent, DonationRecordLinksComponent],
  templateUrl: './agency-receipt-form.component.html',
  styleUrl: './agency-receipt-form.component.scss',
})
export class AgencyReceiptFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issuanceService = inject(AgencyReceiptIssuanceService);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isSendingPassword = signal(false);
  readonly correctingId = signal(false);
  readonly errorText = signal('');
  readonly passwordNotice = signal('');
  readonly task = signal<AgencyReceiptTask | null>(null);
  readonly orgPreview = signal('');
  readonly officerPreview = signal('');
  readonly carriers = RECEIPT_CARRIERS;

  draft: ReceiptDraft = {
    donorName: '',
    donorPhone: '',
    donorEmail: '',
    donorIdNo: '',
    receiptTitle: '',
    agencyName: '',
    agencyAddress: '',
    agencyPhone: '',
    deliveryAddress: '',
    logisticsCarrier: '',
    trackingNo: '',
    lines: [emptyReceiptLine()],
    handoverMethod: '',
    completedOn: '',
    orgSealUrl: '',
    officerSealUrl: '',
  };

  correctedId = '';

  private storedIdNo = '';
  private orgSeal: File | null = null;
  private officerSeal: File | null = null;

  maskedId(): string {
    return maskTaiwanId(this.storedIdNo);
  }

  protected donationId(): string {
    return this.route.snapshot.paramMap.get('donationId') ?? '';
  }

  async ngOnInit(): Promise<void> {
    const donationId = this.donationId();

    try {
      const task = await this.issuanceService.getTask(donationId);

      if (!task || !task.needReceipt) {
        this.errorText.set('找不到這筆需要開立收據的捐助。');
        return;
      }

      this.task.set(task);
      this.draft = this.issuanceService.draftFromTask(task);
      this.storedIdNo = this.draft.donorIdNo;
      this.orgPreview.set(this.draft.orgSealUrl);
      this.officerPreview.set(this.draft.officerSealUrl);
    } catch {
      this.errorText.set('無法載入收據資料，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    const task = this.task();

    if (!task) {
      return;
    }

    if (this.correctingId()) {
      const nextId = normalizeTaiwanId(this.correctedId);

      if (!isTaiwanId(nextId)) {
        this.errorText.set('更正後的身分證字號格式不正確');
        return;
      }

      this.draft.donorIdNo = nextId;
    } else {
      this.draft.donorIdNo = this.storedIdNo;
    }

    this.isSaving.set(true);
    this.errorText.set('');

    try {
      const wasIssued = task.receiptIssued;
      const idChanged = normalizeTaiwanId(this.draft.donorIdNo) !== normalizeTaiwanId(this.storedIdNo);
      await this.issuanceService.saveReceipt(task, this.draft, {
        orgSeal: this.orgSeal,
        officerSeal: this.officerSeal,
      });
      await this.router.navigate(['/agency/receipt-review'], {
        state: {
          notice: idChanged
            ? '收據已用更正後的身分證字號重做。捐助者要改用新字號開啟 PDF。'
            : wasIssued
              ? '收據已更新，加密 PDF 已重新留存。'
              : '收據已開立，加密 PDF 已存入捐助者的會員收據。',
        },
      });
    } catch (error) {
      this.errorText.set(error instanceof Error ? error.message : '儲存失敗，請稍後再試。');
    } finally {
      this.isSaving.set(false);
    }
  }

  startIdCorrection(): void {
    this.correctingId.set(true);
    this.correctedId = '';
    this.passwordNotice.set('');
    this.errorText.set('');
  }

  cancelIdCorrection(): void {
    this.correctingId.set(false);
    this.correctedId = '';
    this.draft.donorIdNo = this.storedIdNo;
  }

  async sendPassword(): Promise<void> {
    const task = this.task();

    if (!task) {
      return;
    }

    this.isSendingPassword.set(true);
    this.passwordNotice.set('');
    this.errorText.set('');

    try {
      await this.issuanceService.sendReceiptPassword(task);
      this.passwordNotice.set('開啟密碼已寄到捐助者的收件匣，這一頁不會顯示完整字號。');
    } catch (error) {
      this.errorText.set(error instanceof Error ? error.message : '無法寄送開啟密碼，請稍後再試。');
    } finally {
      this.isSendingPassword.set(false);
    }
  }

  preview(): void {
    const task = this.task();

    if (!task) {
      return;
    }

    void this.router.navigate(['/agency/receipt-review', task.donationId, 'preview'], {
      state: {
        draft: {
          ...this.draft,
          donorIdNo: this.correctingId() ? normalizeTaiwanId(this.correctedId) : this.storedIdNo,
          orgSealUrl: this.orgPreview(),
          officerSealUrl: this.officerPreview(),
        },
      },
    });
  }

  onSealSelected(kind: 'org' | 'officer', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.errorText.set('章印僅支援 PNG、JPG、WEBP');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorText.set('章印圖片不可超過 2MB');
      input.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    this.errorText.set('');

    if (kind === 'org') {
      this.orgSeal = file;
      this.orgPreview.set(previewUrl);
      return;
    }

    this.officerSeal = file;
    this.officerPreview.set(previewUrl);
  }
}
