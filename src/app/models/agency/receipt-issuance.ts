import { ReceiptLineItem } from '../../core/receipt/donation-receipt-document';

export type ReceiptTaskFilter = 'ALL' | 'UNFINISHED' | 'NEED_RECEIPT' | 'NEED_CERTIFICATE' | 'DONE';

/** 已寫入 donor_receipts 的收據內容，編輯時以此為準。 */
export interface IssuedDonationReceipt {
  id: number;
  receiptNo: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorIdNo: string;
  receiptTitle: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  deliveryAddress: string;
  logisticsCarrier: string;
  trackingNo: string;
  lines: ReceiptLineItem[];
  handoverMethod: string;
  completedOn: string;
  donationItem: string;
  issuedAt: string;
  pdfSentAt: string;
  orgSealUrl: string;
  officerSealUrl: string;
  pdfUrl: string;
  pdfFileName: string;
}

/** 機構開立或修正時送出的欄位。 */
export interface ReceiptDraft {
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorIdNo: string;
  receiptTitle: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  deliveryAddress: string;
  logisticsCarrier: string;
  trackingNo: string;
  lines: ReceiptLineItem[];
  handoverMethod: string;
  completedOn: string;
  orgSealUrl: string;
  officerSealUrl: string;
}

export interface ReceiptSealFiles {
  orgSeal: File | null;
  officerSeal: File | null;
}

export interface AgencyReceiptTask {
  donationId: string;
  donorUid: string;
  donorName: string;
  phone: string;
  donorEmail: string;
  donorIdNo: string;
  demandId: number;
  demandItem: string;
  actualMaterial: string;
  quantity: number;
  donationMethod: string;
  deliveryAddress: string;
  logisticsCarrier: string;
  trackingNo: string;
  receiptLines: ReceiptLineItem[];
  receiptTitle: string;
  needReceipt: boolean;
  passwordChanged: boolean;
  needThankYou: boolean;
  receiptIssued: boolean;
  certificateUploaded: boolean;
  receiptNo: string | null;
  receipt: IssuedDonationReceipt | null;
  certificateFileName: string | null;
  createdAt: string;
  donationDate: string;
}

export const RECEIPT_CARRIERS = ['黑貓宅急便', '7-ELEVEN', '全家', '中華郵政', '新竹物流'] as const;

export const RECEIPT_TASK_FILTER_OPTIONS: { value: ReceiptTaskFilter; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'UNFINISHED', label: '未完成' },
  { value: 'NEED_RECEIPT', label: '待開立收據' },
  { value: 'NEED_CERTIFICATE', label: '待上傳感謝狀' },
  { value: 'DONE', label: '已完成' },
];
