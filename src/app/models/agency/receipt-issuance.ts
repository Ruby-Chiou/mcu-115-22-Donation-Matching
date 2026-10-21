export type ReceiptTaskFilter = 'ALL' | 'NEED_RECEIPT' | 'NEED_CERTIFICATE' | 'DONE';

/** 已寫入 donor_receipts 的收據內容，編輯時以此為準 */
export interface IssuedDonationReceipt {
  id: number;
  receiptNo: string;
  donorName: string;
  receiptTitle: string;
  agencyName: string;
  agencyNameEn: string;
  orgTaxId: string;
  approvalNo: string;
  donorIdNo: string;
  donorAddress: string;
  donorPhone: string;
  donationItem: string;
  donationDate: string;
  note: string;
  accountName: string;
  postalAccount: string;
  orgPhone: string;
  orgFax: string;
  orgEmail: string;
  orgAddress: string;
  handlerName: string;
  issuedAt: string;
  largeSealUrl: string;
  smallSealUrl: string;
}

/** 開立／編輯表單送出的欄位 */
export interface ReceiptDraft {
  donorName: string;
  receiptTitle: string;
  agencyName: string;
  agencyNameEn: string;
  orgTaxId: string;
  approvalNo: string;
  donorIdNo: string;
  donorAddress: string;
  donorPhone: string;
  donationItem: string;
  donationDate: string;
  note: string;
  accountName: string;
  postalAccount: string;
  orgPhone: string;
  orgFax: string;
  orgEmail: string;
  orgAddress: string;
  handlerName: string;
  largeSealUrl: string;
  smallSealUrl: string;
}

export interface ReceiptSealFiles {
  largeSeal: File | null;
  smallSeal: File | null;
}

export interface AgencyReceiptTask {
  donationId: string;
  donorUid: string;
  donorName: string;
  phone: string;
  demandId: number;
  demandItem: string;
  actualMaterial: string;
  quantity: number;
  donationMethod: string;
  receiptTitle: string;
  taxId: string;
  needReceipt: boolean;
  needThankYou: boolean;
  receiptIssued: boolean;
  certificateUploaded: boolean;
  receiptNo: string | null;
  receipt: IssuedDonationReceipt | null;
  certificateFileName: string | null;
  createdAt: string;
  donationDate: string;
}

export const RECEIPT_TASK_FILTER_OPTIONS: { value: ReceiptTaskFilter; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'NEED_RECEIPT', label: '待開立收據' },
  { value: 'NEED_CERTIFICATE', label: '待上傳感謝狀' },
  { value: 'DONE', label: '已完成' },
];
