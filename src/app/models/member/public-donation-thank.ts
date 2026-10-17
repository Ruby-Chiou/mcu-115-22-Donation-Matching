/**
 * 系統公開感謝紀錄（感謝牆統一卡片格式）。
 * 捐助者可在會員專區查看「自己被公開感謝」的條目。
 */
export interface PublicDonationThank {
  id: number;
  donorUid: string;
  /** 公開顯示用（可遮罩，如 王*明） */
  displayName: string;
  honorific: string; // 先生 / 小姐 / 君
  donationItem: string;
  agencyName: string;
  publishedAt: string;
}
