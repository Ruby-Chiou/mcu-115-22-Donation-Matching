import { Component, OnInit, inject, signal } from '@angular/core';

import { DonationReceiptSheetComponent } from '../../../../components/receipt/donation-receipt-sheet/donation-receipt-sheet.component';
import { receiptPdfFileName } from '../../../../core/receipt/donation-receipt-document';
import { DonationReceiptPdfService } from '../../../../core/receipt/donation-receipt-pdf.service';
import { DonationReceiptService } from '../../../../core/services/member-center/donation-receipt.service';
import { DonationReceipt } from '../../../../models/member/donation-receipt';

/**
 * 捐贈收據列表。下載按鈕直接取得 PDF 檔，不開啟列印對話框。
 */
@Component({
  selector: 'app-donation-receipt-list',
  imports: [DonationReceiptSheetComponent],
  templateUrl: './donation-receipt-list.component.html',
  styleUrl: './donation-receipt-list.component.scss',
})
export class DonationReceiptListComponent implements OnInit {
  protected readonly receiptService = inject(DonationReceiptService);
  private readonly receiptPdf = inject(DonationReceiptPdfService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly downloadError = signal('');
  readonly downloadingId = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      await this.receiptService.loadReceipts();
    } catch {
      this.errorText.set('無法載入捐贈收據，請確認資料表已建立後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  async downloadPdf(receipt: DonationReceipt): Promise<void> {
    this.downloadError.set('');
    this.downloadingId.set(receipt.id);

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
      this.downloadingId.set(null);
    }
  }
}
