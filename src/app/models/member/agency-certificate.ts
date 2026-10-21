/**
 * 社福機構上傳的感謝狀檔案。
 * 無統一版面：僅保存並展示一個 PDF 或圖片檔。
 */
export type AgencyCertificateMime = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

export interface AgencyCertificate {
  id: number;
  donorUid: string;
  agencyName: string;
  donationItem: string;
  donationDate: string;
  fileUrl: string;
  fileName: string;
  mimeType: AgencyCertificateMime | string;
  note: string;
  uploadedAt: string;
  /** 對應 donor_daily_donations.id，機構上傳時寫入 */
  donationId?: string;
}

export function isImageCertificate(mimeType: string): boolean {
  return mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/jpg';
}

export function isPdfCertificate(mimeType: string): boolean {
  return mimeType === 'application/pdf' || mimeType.endsWith('/pdf');
}

/** 列表上清楚標示檔案格式，避免使用者誤以為是奇怪副檔名 */
export function certificateFormatLabel(mimeType: string, fileName: string): string {
  if (isPdfCertificate(mimeType) || fileName.toLowerCase().endsWith('.pdf')) {
    return 'PDF';
  }

  if (mimeType === 'image/png' || fileName.toLowerCase().endsWith('.png')) {
    return 'PNG 圖片';
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || /\.jpe?g$/i.test(fileName)) {
    return 'JPG 圖片';
  }

  if (mimeType === 'image/webp' || fileName.toLowerCase().endsWith('.webp')) {
    return 'WEBP 圖片';
  }

  return '檔案';
}
