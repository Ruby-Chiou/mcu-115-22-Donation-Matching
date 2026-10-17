import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { DonationReceiptService } from '../../../../core/services/member-center/donation-receipt.service';
import { DonationReceipt } from '../../../../models/member/donation-receipt';

/**
 * 捐贈收據：系統統一 HTML 版面（非外部圖片／套件）。
 * 列表卡片直接呈現收據預覽，可列印；不依賴第三方服務。
 */
@Component({
  selector: 'app-donation-receipt-list',
  imports: [DatePipe],
  templateUrl: './donation-receipt-list.component.html',
  styleUrl: './donation-receipt-list.component.scss',
})
export class DonationReceiptListComponent implements OnInit {
  protected readonly receiptService = inject(DonationReceiptService);

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly printingId = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      await this.receiptService.loadReceipts();
    } catch {
      this.errorText.set('無法載入捐贈收據，請確認資料表已建立後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  printReceipt(receipt: DonationReceipt): void {
    this.printingId.set(receipt.id);
    window.setTimeout(() => {
      window.print();
      this.printingId.set(null);
    }, 0);
  }
}
