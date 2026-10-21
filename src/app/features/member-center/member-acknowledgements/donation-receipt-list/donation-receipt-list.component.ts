import { Component, OnInit, inject, signal } from '@angular/core';

import { DonationReceiptSheetComponent } from '../../../../components/receipt/donation-receipt-sheet/donation-receipt-sheet.component';
import { downloadReceiptPdf } from '../../../../components/receipt/receipt-print';
import { DonationReceiptService } from '../../../../core/services/member-center/donation-receipt.service';
import { DonationReceipt } from '../../../../models/member/donation-receipt';

/**
 * 捐贈收據：系統統一 HTML 版面（非外部圖片／套件）。
 * 列表卡片直接呈現收據預覽。下載 PDF 只輸出收據紙張。
 */
@Component({
  selector: 'app-donation-receipt-list',
  imports: [DonationReceiptSheetComponent],
  templateUrl: './donation-receipt-list.component.html',
  styleUrl: './donation-receipt-list.component.scss',
})
export class DonationReceiptListComponent implements OnInit {
  protected readonly receiptService = inject(DonationReceiptService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');

  async ngOnInit(): Promise<void> {
    try {
      await this.receiptService.loadReceipts();
    } catch {
      this.errorText.set('無法載入捐贈收據，請確認資料表已建立後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  downloadPdf(host: HTMLElement, receipt: DonationReceipt): void {
    const paper = host.querySelector('.paper');

    if (!(paper instanceof HTMLElement)) {
      return;
    }

    downloadReceiptPdf(paper, receipt.receiptNo);
  }
}
