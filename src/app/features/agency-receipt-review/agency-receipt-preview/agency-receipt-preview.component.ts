import { Component, ElementRef, OnInit, inject, signal } from '@angular/core';
import { downloadReceiptPdf } from '../../../components/receipt/receipt-print';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DonationReceiptSheetComponent } from '../../../components/receipt/donation-receipt-sheet/donation-receipt-sheet.component';
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
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly issuanceService = inject(AgencyReceiptIssuanceService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly preview = signal<DonationReceiptView | null>(null);
  readonly isDraft = signal(false);
  readonly donationId = signal('');

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
      this.preview.set({
        receiptNo: task.receipt?.receiptNo ?? '尚未開立',
        donationDate: source.donationDate,
        agencyName: source.agencyName,
        agencyNameEn: source.agencyNameEn,
        orgTaxId: source.orgTaxId,
        approvalNo: source.approvalNo,
        donorName: source.donorName,
        donorIdNo: source.donorIdNo,
        donorAddress: source.donorAddress,
        donorPhone: source.donorPhone,
        donationItem: source.donationItem,
        note: source.note,
        accountName: source.accountName,
        postalAccount: source.postalAccount,
        orgPhone: source.orgPhone,
        orgFax: source.orgFax,
        orgEmail: source.orgEmail,
        orgAddress: source.orgAddress,
        handlerName: source.handlerName,
        largeSealUrl: source.largeSealUrl,
        smallSealUrl: source.smallSealUrl,
      });
    } catch {
      this.errorText.set('無法載入收據預覽，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  downloadPdf(): void {
    const paper = this.host.nativeElement.querySelector('.paper');

    if (!(paper instanceof HTMLElement)) {
      return;
    }

    downloadReceiptPdf(paper, this.preview()?.receiptNo ?? '');
  }
}
