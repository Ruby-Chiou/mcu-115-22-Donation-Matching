import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { DonationReceiptSheetComponent } from '../../components/receipt/donation-receipt-sheet/donation-receipt-sheet.component';
import { donationNextActionLabel, donationNextStep } from '../../core/auth/member-message-actions';
import { receiptPdfFileName } from '../../core/receipt/donation-receipt-document';
import { DonationReceiptPdfService } from '../../core/receipt/donation-receipt-pdf.service';
import { DonationService } from '../../core/services/agency-daily-demand/daily-donation.service';
import { AgencyCertificateService } from '../../core/services/member-center/agency-certificate.service';
import { DonationReceiptService } from '../../core/services/member-center/donation-receipt.service';
import { DonorDonationHistoryService } from '../../core/services/member-center/donor-donation-history.service';
import { PublicDonationThankService } from '../../core/services/member-center/public-donation-thank.service';
import { AgencyCertificate, isImageCertificate, isPdfCertificate } from '../../models/member/agency-certificate';
import {
  DONATION_HISTORY_FILTER_OPTIONS,
  DONATION_HISTORY_STATUS_LABELS,
  DonationHistoryFilter,
  DonorDonationHistory,
} from '../../models/member/donation-history';
import { DonationReceipt } from '../../models/member/donation-receipt';
import { PublicDonationThank } from '../../models/member/public-donation-thank';
import { RECEIPT_CARRIERS } from '../../models/agency/receipt-issuance';

type FeedbackViewer = 'receipt' | 'certificate' | 'public';

@Component({
  selector: 'app-donor-history',
  imports: [DatePipe, RouterLink, DonationReceiptSheetComponent],
  templateUrl: './donor-history.component.html',
  styleUrl: './donor-history.component.scss',
})
export class DonorHistoryComponent implements OnInit {
  /** 嵌入會員專區時隱藏外層頁面標題 */
  readonly embedded = input(false);

  protected readonly historyService = inject(DonorDonationHistoryService);
  private readonly donationService = inject(DonationService);
  private readonly receiptService = inject(DonationReceiptService);
  private readonly certificateService = inject(AgencyCertificateService);
  private readonly thankService = inject(PublicDonationThankService);
  private readonly receiptPdf = inject(DonationReceiptPdfService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isImageCertificate = isImageCertificate;
  protected readonly isPdfCertificate = isPdfCertificate;

  readonly statusLabels = DONATION_HISTORY_STATUS_LABELS;
  readonly filterOptions = DONATION_HISTORY_FILTER_OPTIONS;
  readonly carriers = RECEIPT_CARRIERS;

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly downloadError = signal('');
  readonly downloadingReceipt = signal(false);
  readonly activeFilter = signal<DonationHistoryFilter>('ALL');
  readonly keyword = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly viewerKind = signal<FeedbackViewer | null>(null);

  readonly filteredRecords = computed(() => {
    const filter = this.activeFilter();
    const keyword = this.keyword().trim().toLowerCase();

    return this.historyService.records().filter((record) => {
      if (
        filter === 'IN_REVIEW' &&
        record.status !== 'pending_ai_review' &&
        record.status !== 'pending_human_review' &&
        record.status !== 'needs_supplement'
      ) {
        return false;
      }

      if (filter === 'APPROVED' && record.status !== 'human_approved') {
        return false;
      }

      if (filter === 'REJECTED' && record.status !== 'human_rejected' && record.status !== 'needs_supplement') {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [record.actualMaterial, record.demandItem, record.recipient, record.donationMethod, this.statusLabels[record.status]].some(
        (text) => text.toLowerCase().includes(keyword)
      );
    });
  });

  readonly selectedRecord = computed(() => {
    const id = this.selectedId();

    return this.historyService.records().find((record) => record.id === id) ?? null;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const recordId = params.get('record') || params.get('donationId');
      if (!recordId || this.isLoading()) {
        return;
      }

      const saved = this.historyService.records().find((record) => record.id === recordId);
      if (saved && this.selectedId() !== saved.id) {
        this.applySelection(saved);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const [historyResult] = await Promise.allSettled([
      this.historyService.loadHistory(),
      this.receiptService.loadReceipts(),
      this.certificateService.loadCertificates(),
      this.thankService.loadMyPublicThanks(),
    ]);

    if (historyResult.status === 'rejected') {
      this.errorText.set('無法載入捐助歷史，請確認已套用資料庫 migration 後再試。');
    }

    const recordId = this.route.snapshot.queryParamMap.get('record') || this.route.snapshot.queryParamMap.get('donationId');
    const saved = recordId ? this.historyService.records().find((record) => record.id === recordId) : undefined;
    if (saved) {
      this.applySelection(saved);
    } else if (!this.selectedId() && this.filteredRecords().length > 0) {
      const needsAction =
        this.filteredRecords().find((record) => !!donationNextActionLabel(record) && record.status !== 'human_rejected') ??
        this.filteredRecords()[0];
      this.applySelection(needsAction);
    }

    this.isLoading.set(false);
  }

  nextActionLabel(record: DonorDonationHistory): string | null {
    return donationNextActionLabel(record);
  }

  nextStep(record: DonorDonationHistory) {
    return donationNextStep(record);
  }

  setFilter(filter: DonationHistoryFilter): void {
    this.activeFilter.set(filter);
    this.selectedId.set(null);
    this.viewerKind.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { record: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onKeywordInput(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
  }

  readonly trackingDraft = signal('');
  readonly carrierDraft = signal('');
  readonly trackingSaving = signal(false);
  readonly trackingMessage = signal('');
  readonly nameModeDraft = signal<'masked' | 'full'>('masked');
  readonly publicDraft = signal(true);
  readonly visibilitySaving = signal(false);
  readonly visibilityMessage = signal('');
  readonly editingPending = signal(false);
  readonly pendingSaving = signal(false);
  readonly pendingMessage = signal('');
  readonly materialDraft = signal('');
  readonly quantityDraft = signal(1);
  readonly noteDraft = signal('');
  readonly methodDraft = signal('寄送');
  readonly supplementFiles = signal<File[]>([]);

  selectRecord(record: DonorDonationHistory): void {
    this.applySelection(record);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { record: record.id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private applySelection(record: DonorDonationHistory): void {
    this.selectedId.set(record.id);
    this.viewerKind.set(null);
    this.trackingDraft.set(record.trackingNo);
    this.carrierDraft.set(record.logisticsCarrier);
    this.trackingMessage.set('');
    this.nameModeDraft.set(record.thankNameMode);
    this.publicDraft.set(record.thankPublic);
    this.visibilityMessage.set('');
    this.editingPending.set(false);
    this.pendingMessage.set('');
    this.materialDraft.set(record.actualMaterial);
    this.quantityDraft.set(record.quantity || 1);
    this.noteDraft.set(record.note);
    this.methodDraft.set(record.donationMethod || '寄送');
  }

  canRevise(record: DonorDonationHistory): boolean {
    return this.historyService.canRevise(record);
  }

  canSupplement(record: DonorDonationHistory): boolean {
    return this.historyService.canSupplement(record);
  }

  onSupplementFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.supplementFiles.set(Array.from(input.files ?? []));
  }

  async submitSupplement(record: DonorDonationHistory): Promise<void> {
    const files = this.supplementFiles();
    if (files.length === 0) {
      this.pendingMessage.set('請先選擇至少一張物資照片再送審。');
      return;
    }

    this.pendingSaving.set(true);
    this.pendingMessage.set('');

    try {
      await this.historyService.updatePendingDonation(record.id, {
        actualMaterial: this.materialDraft() || record.actualMaterial,
        quantity: this.quantityDraft() || record.quantity,
        note: this.noteDraft(),
        donationMethod: this.methodDraft() || record.donationMethod,
      }).catch(() => undefined);

      await this.donationService.uploadSupplementFiles(record.id, files);
      await this.historyService.resubmitAfterSupplement(record.id);

      let reviewNote = '已補件並重新送審。';
      try {
        const ai = await this.donationService.runAiReviewAfterSubmit(record.id);
        if (ai.status === 'needs_supplement') {
          reviewNote = '照片仍不足，請再補上傳後送審。';
        } else if (ai.status === 'pending_human_review') {
          reviewNote = 'AI 已審完，已送到受助機構待人工確認。';
        } else {
          reviewNote = `已補件送審：${ai.decisionText || ai.status}`;
        }
      } catch (aiError) {
        reviewNote =
          aiError instanceof Error
            ? `已補件，但 AI 沒跑完：${aiError.message}`
            : '已補件，但 AI 沒跑完，請稍後再試或等機構查看。';
      }

      this.supplementFiles.set([]);
      this.editingPending.set(false);
      this.pendingMessage.set(reviewNote);
      await this.historyService.loadHistory();
      const refreshed = this.historyService.records().find((item) => item.id === record.id);
      if (refreshed) {
        this.applySelection(refreshed);
      }
    } catch (error) {
      this.pendingMessage.set(error instanceof Error ? error.message : '補件送審失敗，請稍後再試。');
    } finally {
      this.pendingSaving.set(false);
    }
  }

  startEditPending(): void {
    this.editingPending.set(true);
    this.pendingMessage.set('');
  }

  cancelEditPending(record: DonorDonationHistory): void {
    this.editingPending.set(false);
    this.materialDraft.set(record.actualMaterial);
    this.quantityDraft.set(record.quantity || 1);
    this.noteDraft.set(record.note);
    this.methodDraft.set(record.donationMethod || '寄送');
    this.pendingMessage.set('');
  }

  async savePending(record: DonorDonationHistory): Promise<void> {
    this.pendingSaving.set(true);
    this.pendingMessage.set('');

    try {
      await this.historyService.updatePendingDonation(record.id, {
        actualMaterial: this.materialDraft(),
        quantity: this.quantityDraft(),
        note: this.noteDraft(),
        donationMethod: this.methodDraft(),
      });
      this.editingPending.set(false);
      this.pendingMessage.set('已更新這筆審核中的捐助。');
    } catch (error) {
      this.pendingMessage.set(error instanceof Error ? error.message : '更新失敗，請稍後再試。');
    } finally {
      this.pendingSaving.set(false);
    }
  }

  async withdrawPending(record: DonorDonationHistory): Promise<void> {
    if (!window.confirm('確定撤回這筆尚未審核完成的捐助？撤回後需重新送出。')) {
      return;
    }

    this.pendingSaving.set(true);
    this.pendingMessage.set('');

    try {
      await this.historyService.withdrawPendingDonation(record.id);
      this.selectedId.set(null);
      this.editingPending.set(false);
      this.pendingMessage.set('已撤回這筆捐助。');
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { record: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } catch (error) {
      this.pendingMessage.set(error instanceof Error ? error.message : '撤回失敗，請稍後再試。');
    } finally {
      this.pendingSaving.set(false);
    }
  }

  async saveVisibility(record: DonorDonationHistory): Promise<void> {
    this.visibilitySaving.set(true);
    this.visibilityMessage.set('');

    try {
      await this.thankService.setDonationVisibility(record.id, this.nameModeDraft(), this.publicDraft());
      await Promise.all([this.historyService.loadHistory(), this.thankService.loadMyPublicThanks()]);
      this.visibilityMessage.set(this.publicDraft() ? '已更新公開感謝的顯示方式。' : '這筆已改成只有自己看得到。');
    } catch (error) {
      this.visibilityMessage.set(error instanceof Error ? error.message : '顯示方式沒有更新，請稍後再試。');
    } finally {
      this.visibilitySaving.set(false);
    }
  }

  onCarrierChange(event: Event): void {
    this.carrierDraft.set((event.target as HTMLSelectElement).value);
  }

  onTrackingInput(event: Event): void {
    this.trackingDraft.set((event.target as HTMLInputElement).value);
  }

  async saveTracking(record: DonorDonationHistory): Promise<void> {
    this.trackingSaving.set(true);
    this.trackingMessage.set('');

    try {
      await this.historyService.saveTrackingNumber(record.id, this.trackingDraft(), this.carrierDraft());
      await this.thankService.loadBroadcasts();
      this.trackingMessage.set('物流公司與單號已上傳，受助機構看得到這筆寄送資料。');
    } catch (error) {
      this.trackingMessage.set(error instanceof Error ? error.message : '上傳物流資料失敗，請稍後再試。');
    } finally {
      this.trackingSaving.set(false);
    }
  }

  receiptOf(record: DonorDonationHistory): DonationReceipt | null {
    return this.receiptService.receipts().find((receipt) => receipt.donationId === record.id) ?? null;
  }

  certificateOf(record: DonorDonationHistory): AgencyCertificate | null {
    return this.certificateService.certificates().find((certificate) => certificate.donationId === record.id) ?? null;
  }

  publicThankOf(record: DonorDonationHistory): PublicDonationThank | null {
    return this.thankService.thanks().find((item) => item.donationId === record.id) ?? null;
  }

  openViewer(kind: FeedbackViewer): void {
    this.viewerKind.set(kind);
  }

  closeViewer(): void {
    this.viewerKind.set(null);
  }

  pdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  async downloadPdf(receipt: DonationReceipt): Promise<void> {
    this.downloadError.set('');
    this.downloadingReceipt.set(true);

    try {
      const fileName = receipt.pdfFileName || receiptPdfFileName(receipt.receiptNo);

      if (receipt.pdfUrl) {
        await this.receiptPdf.downloadStored(receipt.pdfUrl, fileName);
        return;
      }

      await this.receiptPdf.downloadProtected(receipt, receipt.donorIdNo);
    } catch (error) {
      this.downloadError.set(error instanceof Error ? error.message : '無法下載 PDF');
    } finally {
      this.downloadingReceipt.set(false);
    }
  }

  statusTone(status: DonorDonationHistory['status']): string {
    if (status === 'human_approved') {
      return 'approved';
    }

    if (status === 'human_rejected' || status === 'needs_supplement') {
      return 'rejected';
    }

    return 'review';
  }

  progressSteps(record: DonorDonationHistory): { label: string; done: boolean; current: boolean }[] {
    const status = record.status;
    const approved = status === 'human_approved';
    const rejected = status === 'human_rejected';
    const needsSupplement = status === 'needs_supplement';
    const shipped = record.donationMethod === '寄送';
    const steps = [
      { label: '提交申請', done: true, current: false },
      {
        label: 'AI 審核',
        done: status !== 'pending_ai_review' && !needsSupplement,
        current: status === 'pending_ai_review' || needsSupplement,
      },
      {
        label: '機構審核',
        done: approved || rejected,
        current: status === 'pending_human_review',
      },
    ];

    if (needsSupplement) {
      steps.push({ label: '需補件', done: false, current: true });
      return steps;
    }

    if (rejected) {
      steps.push({ label: '未通過／可補件', done: true, current: true });
      return steps;
    }

    if (shipped) {
      steps.push({
        label: '選擇物流並上傳單號',
        done: approved && !!record.trackingNo && !!record.logisticsCarrier,
        current: approved && (!record.trackingNo || !record.logisticsCarrier),
      });
    }

    const waitingReceipt = approved && (!shipped || (!!record.trackingNo && !!record.logisticsCarrier)) && !record.receiptConfirmedAt;
    steps.push({
      label: '受助者簽收',
      done: !!record.receiptConfirmedAt,
      current: waitingReceipt,
    });

    return steps;
  }
}
