export interface DonationCertificate {
  id: number;
  certificateNo: string; // 感謝狀字號
  donorUid: string;
  donorName: string;
  agencyName: string;
  agencyRepresentative: string;
  donationItem: string; // 捐贈內容
  donationDate: string;
  message: string; // 感謝內文
  issuedAt: string;
}
