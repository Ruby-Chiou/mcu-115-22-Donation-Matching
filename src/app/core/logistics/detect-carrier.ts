import { RECEIPT_CARRIERS } from '../../models/agency/receipt-issuance';

export type LogisticsCarrier = (typeof RECEIPT_CARRIERS)[number];

/**
 * 依台灣常見單號格式提供保守的物流商建議。
 * 10～11 碼純數字在嘉里、新竹與超商間可能重疊，因此只能作為自動帶入，
 * 使用者仍可手動修正；10 碼優先嘉里、11 碼優先新竹。
 */
export function detectCarrier(trackingNo: string): LogisticsCarrier | null {
  const normalized = trackingNo.trim().replace(/[\s-]/g, '').toUpperCase();

  if (/^(CN|RF|CP)[A-Z0-9]*$/.test(normalized) || /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(normalized)) {
    return '中華郵政';
  }

  if (/^\d{12}$/.test(normalized)) {
    return '黑貓宅急便';
  }

  if (/^\d{8}$/.test(normalized)) {
    return '7-ELEVEN';
  }

  if (/^\d{10}$/.test(normalized)) {
    return '嘉里物流';
  }

  if (/^\d{11}$/.test(normalized)) {
    return '新竹物流';
  }

  // 全家單號與其他純數字格式高度重疊，沒有可靠特徵時不猜測。
  return null;
}
