/** 系統開立的捐贈收據（統一格式） */
export interface DonationReceipt {
  id: number;
  receiptNo: string;
  donorUid: string;
  donorName: string;
  receiptTitle: string;
  agencyName: string;
  donationItem: string;
  donationDate: string;
  issuedAt: string;
}
