import { Injectable } from '@angular/core';
import { PDFDocument } from '@cantoo/pdf-lib';

import { ReceiptPdfEncryptor } from './receipt-pdf-encryptor';

@Injectable({
  providedIn: 'root',
})
export class CantooReceiptPdfEncryptor implements ReceiptPdfEncryptor {
  async protect(pdf: Uint8Array, userPassword: string): Promise<Uint8Array> {
    const document = await PDFDocument.load(pdf);

    document.encrypt({
      userPassword,
      ownerPassword: userPassword,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false,
      },
    });

    return document.save();
  }
}
