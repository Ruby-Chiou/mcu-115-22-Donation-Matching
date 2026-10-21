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
  /** 對應 donor_daily_donations.id；舊的種子資料可能沒有 */
  donationId?: string;
}

/** 公開牆不顯示全名。兩個字留姓，更長則留頭尾。 */
export function maskDonorName(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return '匿名';
  }

  const chars = [...trimmed];

  if (chars.length <= 2) {
    return `${chars[0]}*`;
  }

  return `${chars[0]}*${chars[chars.length - 1]}`;
}

/** 跑馬燈只廣播「審核已過、物流單號已上傳」的捐助，字要短。 */
export interface DonationBroadcast {
  id: string;
  displayName: string;
  donationItem: string;
}

/** 假資料曾把「尚未開立」寫進物資名稱，公開時拿掉。 */
export function publicDonationItem(material: string): string {
  const cleaned = material.replace(/（尚未[^）]*）/g, '').replace(/\s+/g, ' ').trim();

  return cleaned || '捐贈物資';
}
