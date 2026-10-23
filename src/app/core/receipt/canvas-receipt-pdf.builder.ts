import { Injectable } from '@angular/core';
import { PDFDocument } from '@cantoo/pdf-lib';

import { DonationReceiptDocument } from './donation-receipt-document';
import { paintReceipt } from './receipt-canvas-painter';
import { ReceiptPdfBuilder } from './receipt-pdf-builder';

@Injectable({
  providedIn: 'root',
})
export class CanvasReceiptPdfBuilder implements ReceiptPdfBuilder {
  async build(document: DonationReceiptDocument): Promise<Uint8Array> {
    const png = await paintReceipt(document);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const image = await pdf.embedPng(png);

    page.drawImage(image, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });
    pdf.setTitle(`捐贈收據 ${document.receiptNo || ''}`.trim());

    return pdf.save();
  }
}
