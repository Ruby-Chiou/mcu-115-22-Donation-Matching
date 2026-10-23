import { Component, input, model, signal } from '@angular/core';

import { DonationReceiptSheetComponent } from '../donation-receipt-sheet/donation-receipt-sheet.component';
import { ReceiptLineEditorComponent } from '../receipt-line-editor/receipt-line-editor.component';
import { DonationReceiptView } from '../../../models/member/donation-receipt';
import { ReceiptLineItem, emptyReceiptLine } from '../../../core/receipt/donation-receipt-document';

@Component({
  selector: 'app-donor-receipt-request',
  imports: [DonationReceiptSheetComponent, ReceiptLineEditorComponent],
  templateUrl: './donor-receipt-request.component.html',
  styleUrl: './donor-receipt-request.component.scss',
})
export class DonorReceiptRequestComponent {
  readonly donorName = input('');
  readonly donorPhone = input('');
  readonly handoverMethod = input('');
  readonly suggestedItem = input('');
  readonly suggestedQuantity = input(1);

  readonly donorEmail = model('');
  readonly donorIdNo = model('');
  readonly lines = model<ReceiptLineItem[]>([]);
  readonly agreed = model(false);

  readonly showPreview = signal(false);

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  checkedValue(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  useSuggestedItem(): void {
    const current = this.lines();
    const suggested = emptyReceiptLine(this.suggestedItem(), this.suggestedQuantity() > 0 ? this.suggestedQuantity() : 1);

    if (current.length === 0) {
      this.lines.set([suggested]);
      return;
    }

    this.lines.set(current.map((line, index) => (index === 0 ? { ...line, name: suggested.name, quantity: suggested.quantity } : line)));
  }

  togglePreview(): void {
    if (this.lines().length === 0) {
      this.useSuggestedItem();
    }

    this.showPreview.update((open) => !open);
  }

  previewSheet(): DonationReceiptView {
    return {
      receiptNo: '尚未開立',
      issuedOn: '',
      donorName: this.donorName(),
      donorPhone: this.donorPhone(),
      donorEmail: this.donorEmail(),
      agencyName: '由受贈機構開立時填寫',
      agencyAddress: '',
      agencyPhone: '',
      lines: this.lines(),
      handoverMethod: this.handoverMethod(),
      completedOn: '',
      orgSealUrl: '',
      officerSealUrl: '',
    };
  }
}
