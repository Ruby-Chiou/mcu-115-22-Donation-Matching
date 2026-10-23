import { DonationReceiptDocument } from './donation-receipt-document';

/** 只負責把收據文件畫成 PDF 位元組，不處理密碼、下載或上傳。 */
export interface ReceiptPdfBuilder {
  build(document: DonationReceiptDocument): Promise<Uint8Array>;
}
