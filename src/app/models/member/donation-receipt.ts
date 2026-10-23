import { DonationReceiptDocument } from '../../core/receipt/donation-receipt-document';

/** 畫面上的收據，欄位與下載的 PDF 相同。 */
export type DonationReceiptView = DonationReceiptDocument;

/** 系統留存的捐贈收據。身分證字號只做 PDF 密碼，不印在文件上。 */
export interface DonationReceipt extends DonationReceiptView {
  id: number;
  donorUid: string;
  donorIdNo: string;
  receiptTitle: string;
  issuedAt: string;
  donationId?: string;
  pdfUrl: string;
  pdfFileName: string;
}
