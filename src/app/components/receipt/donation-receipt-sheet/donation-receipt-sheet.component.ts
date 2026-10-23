import { Component, input } from '@angular/core';

import {
  formatReceiptDate,
  formatReceiptPrice,
  lineSubtotal,
  receiptPriceTotal,
  receiptQuantityLabel,
} from '../../../core/receipt/donation-receipt-document';
import { DonationReceiptView } from '../../../models/member/donation-receipt';

@Component({
  selector: 'app-donation-receipt-sheet',
  templateUrl: './donation-receipt-sheet.component.html',
  styleUrl: './donation-receipt-sheet.component.scss',
})
export class DonationReceiptSheetComponent {
  readonly sheet = input.required<DonationReceiptView>();
  readonly formatDate = formatReceiptDate;
  readonly formatPrice = formatReceiptPrice;
  readonly lineSubtotal = lineSubtotal;
  readonly priceTotal = receiptPriceTotal;
  readonly quantityLabel = receiptQuantityLabel;
}
