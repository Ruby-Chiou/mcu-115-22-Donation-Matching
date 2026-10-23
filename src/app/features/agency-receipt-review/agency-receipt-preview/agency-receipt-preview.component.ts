import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DonationReceiptSheetComponent } from '../../../components/receipt/donation-receipt-sheet/donation-receipt-sheet.component';
import { DonationReceiptPdfService } from '../../../core/receipt/donation-receipt-pdf.service';
import { AgencyReceiptIssuanceService } from '../../../core/services/agency/agency-receipt-issuance.service';
import { ReceiptDraft } from '../../../models/agency/receipt-issuance';
import { DonationReceiptView } from '../../../models/member/donation-receipt';

@Component({
  selector: 'app-agency-receipt-preview',
  imports: [RouterLink, DonationReceiptSheetComponent],
  templateUrl: './agency-receipt-preview.component.html',
  styleUrl: './agency-receipt-preview.component.scss',
})
export class AgencyReceiptPreviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly issuanceService = inject(AgencyReceiptIssuanceService);
  private readonly receiptPdf = inject(DonationReceiptPdfService);

  readonly isLoading = signal(true);
  readonly isDownloading = signal(false);
  readonly errorText = signal('');
  readonly downloadError = signal('');
  readonly preview = signal<DonationReceiptView | null>(null);
  readonly isDraft = signal(false);
  readonly donationId = signal('');
  private readonly password = signal('');

  async ngOnInit(): Promise<void> {
    const donationId = this.route.snapshot.paramMap.get('donationId') ?? '';
    this.donationId.set(donationId);
    const incomingDraft = history.state?.draft as ReceiptDraft | undefined;

    try {
      const task = await this.issuanceService.getTask(donationId);

      if (!task || !task.needReceipt) {
        this.errorText.set('找不到這筆收據。');
        return;
      }

      const source = incomingDraft ?? this.issuanceService.draftFromTask(task);

      this.isDraft.set(!task.receipt || !!incomingDraft);
      this.password.set(source.donorIdNo);
      this.preview.set({
        receiptNo: task.receipt?.receiptNo ?? '尚未開立',
        issuedOn: task.receipt?.issuedAt.slice(0, 10) ?? '',
        donorName: source.donorName,
        donorPhone: source.donorPhone,
        donorEmail: source.donorEmail,
        agencyName: source.agencyName,
        agencyAddress: source.agencyAddress,
        agencyPhone: source.agencyPhone,
        deliveryAddress: source.deliveryAddress,
        logisticsCarrier: source.logisticsCarrier,
        trackingNo: source.trackingNo,
        lines: source.lines,
        handoverMethod: source.handoverMethod,
        completedOn: source.completedOn,
        orgSealUrl: source.orgSealUrl,
        officerSealUrl: source.officerSealUrl,
      });
    } catch {
      this.errorText.set('無法載入收據預覽，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  async downloadPdf(): Promise<void> {
    const sheet = this.preview();

    if (!sheet) {
      return;
    }

    this.isDownloading.set(true);
    this.downloadError.set('');

    try {
      await this.receiptPdf.downloadProtected(sheet, this.password());
    } catch (error) {
      this.downloadError.set(error instanceof Error ? error.message : '無法下載 PDF');
    } finally {
      this.isDownloading.set(false);
    }
  }
}
