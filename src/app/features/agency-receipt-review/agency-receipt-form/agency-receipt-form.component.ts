import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AgencyReceiptIssuanceService } from '../../../core/services/agency/agency-receipt-issuance.service';
import { AgencyReceiptTask, ReceiptDraft } from '../../../models/agency/receipt-issuance';

@Component({
  selector: 'app-agency-receipt-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './agency-receipt-form.component.html',
  styleUrl: './agency-receipt-form.component.scss',
})
export class AgencyReceiptFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issuanceService = inject(AgencyReceiptIssuanceService);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorText = signal('');
  readonly task = signal<AgencyReceiptTask | null>(null);

  readonly largePreview = signal('');
  readonly smallPreview = signal('');

  draft: ReceiptDraft = {
    donorName: '',
    receiptTitle: '',
    agencyName: '',
    agencyNameEn: '',
    orgTaxId: '',
    approvalNo: '',
    donorIdNo: '',
    donorAddress: '',
    donorPhone: '',
    donationItem: '',
    donationDate: '',
    note: '',
    accountName: '',
    postalAccount: '',
    orgPhone: '',
    orgFax: '',
    orgEmail: '',
    orgAddress: '',
    handlerName: '',
    largeSealUrl: '',
    smallSealUrl: '',
  };

  private largeSeal: File | null = null;
  private smallSeal: File | null = null;

  async ngOnInit(): Promise<void> {
    const donationId = this.route.snapshot.paramMap.get('donationId') ?? '';

    try {
      const task = await this.issuanceService.getTask(donationId);

      if (!task || !task.needReceipt) {
        this.errorText.set('找不到這筆需要開立收據的捐助。');
        return;
      }

      this.task.set(task);
      this.draft = this.issuanceService.draftFromTask(task);
      this.largePreview.set(this.draft.largeSealUrl);
      this.smallPreview.set(this.draft.smallSealUrl);
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

    this.isSaving.set(true);
    this.errorText.set('');

    try {
      const wasIssued = task.receiptIssued;
      await this.issuanceService.saveReceipt(task, this.draft, {
        largeSeal: this.largeSeal,
        smallSeal: this.smallSeal,
      });
      await this.router.navigate(['/agency/receipt-review'], {
        state: { notice: wasIssued ? '收據內容已更新。' : '收據已開立，可再從列表進入編輯或預覽。' },
      });
    } catch (error) {
      this.errorText.set(error instanceof Error ? error.message : '儲存失敗，請稍後再試。');
    } finally {
      this.isSaving.set(false);
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
          largeSealUrl: this.largePreview(),
          smallSealUrl: this.smallPreview(),
        },
      },
    });
  }

  onSealSelected(kind: 'large' | 'small', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.errorText.set('大小章僅支援 PNG、JPG、WEBP');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorText.set('大小章圖片不可超過 2MB');
      input.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    this.errorText.set('');

    if (kind === 'large') {
      this.largeSeal = file;
      this.largePreview.set(previewUrl);
      return;
    }

    this.smallSeal = file;
    this.smallPreview.set(previewUrl);
  }
}
