import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { DonationReceiptView } from '../../../models/member/donation-receipt';

@Component({
  selector: 'app-donation-receipt-sheet',
  imports: [DatePipe],
  templateUrl: './donation-receipt-sheet.component.html',
  styleUrl: './donation-receipt-sheet.component.scss',
})
export class DonationReceiptSheetComponent {
  readonly sheet = input.required<DonationReceiptView>();
}
