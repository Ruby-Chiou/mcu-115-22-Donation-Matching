/** 收據紙本上要印出的欄位 */
export interface DonationReceiptView {
  receiptNo: string;
  donationDate: string;
  agencyName: string;
  agencyNameEn: string;
  orgTaxId: string;
  approvalNo: string;
  donorName: string;
  donorIdNo: string;
  donorAddress: string;
  donorPhone: string;
  donationItem: string;
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

/** 系統開立的捐贈收據（統一格式） */
export interface DonationReceipt extends DonationReceiptView {
  id: number;
  donorUid: string;
  receiptTitle: string;
  issuedAt: string;
  /** 對應 donor_daily_donations.id，機構核發時寫入 */
  donationId?: string;
}
