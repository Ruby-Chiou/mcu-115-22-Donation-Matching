import { Injectable, inject } from '@angular/core';

import { CanvasReceiptPdfBuilder } from './canvas-receipt-pdf.builder';
import { CantooReceiptPdfEncryptor } from './cantoo-receipt-pdf.encryptor';
import { DonationReceiptDocument, receiptPdfFileName } from './donation-receipt-document';
import { ReceiptPdfBuilder } from './receipt-pdf-builder';
import { ReceiptPdfEncryptor } from './receipt-pdf-encryptor';
import { savePdfFile } from './receipt-file-download';
import { isTaiwanId, normalizeTaiwanId } from './taiwan-id';

export interface ReceiptPdfFile {
  bytes: Uint8Array;
  fileName: string;
}

@Injectable({
  providedIn: 'root',
})
export class DonationReceiptPdfService {
  private readonly builder: ReceiptPdfBuilder = inject(CanvasReceiptPdfBuilder);
  private readonly encryptor: ReceiptPdfEncryptor = inject(CantooReceiptPdfEncryptor);

  async createProtectedFile(document: DonationReceiptDocument, donorIdNo: string): Promise<ReceiptPdfFile> {
    const password = normalizeTaiwanId(donorIdNo);

    if (!isTaiwanId(password)) {
      throw new Error('缺少有效的身分證字號，無法產生加密 PDF');
    }

    const plain = await this.builder.build(document);
    const bytes = await this.encryptor.protect(plain, password);

    return {
      bytes,
      fileName: receiptPdfFileName(document.receiptNo),
    };
  }

  async downloadProtected(document: DonationReceiptDocument, donorIdNo: string): Promise<void> {
    const file = await this.createProtectedFile(document, donorIdNo);
    savePdfFile(file.bytes, file.fileName);
  }

  /** 下載機構開立時留存的那一份，不再另開列印畫面。 */
  async downloadStored(url: string, fileName: string): Promise<void> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('無法下載已留存的收據檔案');
    }

    savePdfFile(new Uint8Array(await response.arrayBuffer()), fileName);
  }
}
