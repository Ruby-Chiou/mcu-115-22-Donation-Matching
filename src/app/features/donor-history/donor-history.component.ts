import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { DonationReceiptSheetComponent } from '../../components/receipt/donation-receipt-sheet/donation-receipt-sheet.component';
import { receiptPdfFileName } from '../../core/receipt/donation-receipt-document';
import { DonationReceiptPdfService } from '../../core/receipt/donation-receipt-pdf.service';
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
  private readonly receiptService = inject(DonationReceiptService);
  private readonly certificateService = inject(AgencyCertificateService);
  private readonly thankService = inject(PublicDonationThankService);
  private readonly receiptPdf = inject(DonationReceiptPdfService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly isImageCertificate = isImageCertificate;
  protected readonly isPdfCertificate = isPdfCertificate;

  readonly statusLabels = DONATION_HISTORY_STATUS_LABELS;
  readonly filterOptions = DONATION_HISTORY_FILTER_OPTIONS;

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
      if (filter === 'IN_REVIEW' && record.status !== 'pending_ai_review' && record.status !== 'pending_human_review') {
        return false;
      }

      if (filter === 'APPROVED' && record.status !== 'human_approved') {
        return false;
      }

      if (filter === 'REJECTED' && record.status !== 'human_rejected') {
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

    this.isLoading.set(false);
  }

  setFilter(filter: DonationHistoryFilter): void {
    this.activeFilter.set(filter);
    this.selectedId.set(null);
    this.viewerKind.set(null);
  }

  onKeywordInput(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
  }

  readonly trackingDraft = signal('');
  readonly trackingSaving = signal(false);
  readonly trackingMessage = signal('');

  selectRecord(record: DonorDonationHistory): void {
    this.selectedId.set(record.id);
    this.viewerKind.set(null);
    this.trackingDraft.set(record.trackingNo);
    this.trackingMessage.set('');
  }

  onTrackingInput(event: Event): void {
    this.trackingDraft.set((event.target as HTMLInputElement).value);
  }

  async saveTracking(record: DonorDonationHistory): Promise<void> {
    this.trackingSaving.set(true);
    this.trackingMessage.set('');

    try {
      await this.historyService.saveTrackingNumber(record.id, this.trackingDraft());
      await this.thankService.loadBroadcasts();
      this.trackingMessage.set('單號已上傳，這筆捐助會出現在全站跑馬燈。');
    } catch (error) {
      this.trackingMessage.set(error instanceof Error ? error.message : '上傳物流單號失敗，請稍後再試。');
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

    if (status === 'human_rejected') {
      return 'rejected';
    }

    return 'review';
  }

  progressSteps(record: DonorDonationHistory): { label: string; done: boolean; current: boolean }[] {
    const status = record.status;
    const approved = status === 'human_approved';
    const rejected = status === 'human_rejected';
    const shipped = record.donationMethod === '寄送';
    const steps = [
      { label: '提交申請', done: true, current: false },
      {
        label: 'AI 審核',
        done: status !== 'pending_ai_review',
        current: status === 'pending_ai_review',
      },
      {
        label: '機構審核',
        done: approved || rejected,
        current: status === 'pending_human_review',
      },
    ];

    if (rejected) {
      steps.push({ label: '未通過', done: true, current: true });
      return steps;
    }

    if (shipped) {
      steps.push({
        label: '上傳物流單號',
        done: approved && !!record.trackingNo,
        current: approved && !record.trackingNo,
      });
    }

    const waitingReceipt = approved && (!shipped || !!record.trackingNo) && !record.receiptConfirmedAt;
    steps.push({
      label: '受助者簽收',
      done: !!record.receiptConfirmedAt,
      current: waitingReceipt,
    });

    return steps;
  }
}
