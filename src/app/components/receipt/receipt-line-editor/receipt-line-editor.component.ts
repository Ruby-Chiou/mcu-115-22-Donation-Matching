import { Component, model } from '@angular/core';

import { ReceiptLineItem, emptyReceiptLine } from '../../../core/receipt/donation-receipt-document';

@Component({
  selector: 'app-receipt-line-editor',
  templateUrl: './receipt-line-editor.component.html',
  styleUrl: './receipt-line-editor.component.scss',
})
export class ReceiptLineEditorComponent {
  readonly lines = model.required<ReceiptLineItem[]>();

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  addLine(): void {
    this.lines.update((lines) => [...lines, emptyReceiptLine()]);
  }

  removeLine(index: number): void {
    this.lines.update((lines) => (lines.length === 1 ? lines : lines.filter((_, lineIndex) => lineIndex !== index)));
  }

  patch(index: number, key: 'name' | 'unit', value: string): void {
    this.lines.update((lines) => lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)));
  }

  patchQuantity(index: number, value: string): void {
    const quantity = Number(value);
    this.lines.update((lines) =>
      lines.map((line, lineIndex) => (lineIndex === index ? { ...line, quantity: Number.isFinite(quantity) ? quantity : 0 } : line)),
    );
  }

  patchPrice(index: number, value: string): void {
    const price = value.trim() === '' ? null : Number(value);
    this.lines.update((lines) =>
      lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, estimatedPrice: price !== null && Number.isFinite(price) ? price : null } : line,
      ),
    );
  }
}
