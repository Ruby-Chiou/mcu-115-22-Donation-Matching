import { isReceiptEmail } from './receipt-contact';
import { isTaiwanId, normalizeTaiwanId } from './taiwan-id';

/** 收據上的一列物資。品項由捐助者填，機構開立前可以改。 */
export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number | null;
}

/**
 * 電子收據文件。畫面上的預覽和下載的 PDF 都只讀這份資料，
 * 不把資料庫欄位名稱直接畫進版面。
 */
export interface DonationReceiptDocument {
  receiptNo: string;
  issuedOn: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  /** 這筆需求的實際收貨地址，和機構會址不同。 */
  deliveryAddress?: string;
  logisticsCarrier?: string;
  trackingNo?: string;
  lines: ReceiptLineItem[];
  handoverMethod: string;
  completedOn: string;
  orgSealUrl: string;
  officerSealUrl: string;
}

const ITEM_COUNT = /^(.+?)\s+(\d+)\s*(瓶|箱|包|件|個|盒|袋|組|雙|條|罐|公斤|斤|公升|公克|毫升|ml)$/i;

export function emptyReceiptLine(name = '', quantity = 1): ReceiptLineItem {
  return lineFromItemText(name, quantity);
}

/** 把「橘子工坊洗衣精 3 瓶」拆成品項、數量、單位。沒有寫數量時沿用捐助單上的數量。 */
export function lineFromItemText(text: string, fallbackQuantity = 1, fallbackUnit = '件'): ReceiptLineItem {
  const trimmed = text.trim();
  const match = trimmed.match(ITEM_COUNT);

  if (match?.[1]?.trim()) {
    return {
      name: match[1].trim(),
      quantity: Number(match[2]),
      unit: match[3],
      estimatedPrice: null,
    };
  }

  return {
    name: trimmed,
    quantity: fallbackQuantity > 0 ? fallbackQuantity : 1,
    unit: fallbackUnit,
    estimatedPrice: null,
  };
}

export function lineSubtotal(line: ReceiptLineItem): number | null {
  if (line.estimatedPrice === null || !Number.isFinite(line.estimatedPrice) || !Number.isFinite(line.quantity)) {
    return null;
  }

  return line.quantity * line.estimatedPrice;
}

export function receiptQuantityTotal(lines: ReceiptLineItem[]): number {
  return lines.reduce((sum, line) => sum + (Number.isFinite(line.quantity) ? line.quantity : 0), 0);
}

export function receiptQuantityLabel(lines: ReceiptLineItem[]): string {
  const total = receiptQuantityTotal(lines);
  const units = [...new Set(lines.map((line) => line.unit.trim()).filter((unit) => unit))];

  if (units.length === 1) {
    return `${total} ${units[0]}`;
  }

  return String(total);
}

export function receiptPriceTotal(lines: ReceiptLineItem[]): number | null {
  const subtotals = lines.map((line) => lineSubtotal(line)).filter((value): value is number => value !== null);

  if (subtotals.length === 0) {
    return null;
  }

  return subtotals.reduce((sum, value) => sum + value, 0);
}

export function parseReceiptLines(value: unknown, fallbackName = '', fallbackQuantity = 1): ReceiptLineItem[] {
  if (!Array.isArray(value)) {
    return fallbackName ? [lineFromItemText(fallbackName, fallbackQuantity)] : [];
  }

  const lines = value.map((item) => normalizeReceiptLine(item)).filter((line) => line.name || line.unit || line.quantity > 0);

  if (lines.length > 0) {
    return lines;
  }

  return fallbackName ? [lineFromItemText(fallbackName, fallbackQuantity)] : [];
}

export function normalizeReceiptLine(value: unknown): ReceiptLineItem {
  const row = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const quantity = Number(row['quantity']);
  const price = row['estimatedPrice'];
  const parsedPrice = price === null || price === undefined || price === '' ? null : Number(price);
  const rawName = String(row['name'] ?? '').trim();
  const unit = String(row['unit'] ?? '').trim();
  const parsedQuantity = Number.isFinite(quantity) ? quantity : 0;
  const split = lineFromItemText(rawName, parsedQuantity > 0 ? parsedQuantity : 1, unit || '件');
  const nameStillContainsCount = split.name !== rawName;

  if (nameStillContainsCount && parsedQuantity <= 1) {
    return {
      ...split,
      estimatedPrice: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
    };
  }

  return {
    name: rawName,
    quantity: parsedQuantity,
    unit,
    estimatedPrice: parsedPrice !== null && Number.isFinite(parsedPrice) ? parsedPrice : null,
  };
}

export function summarizeReceiptLines(lines: ReceiptLineItem[]): string {
  return lines
    .filter((line) => line.name.trim())
    .map((line) => `${line.name.trim()} ${line.quantity}${line.unit.trim()}`)
    .join('、');
}

export function formatReceiptDate(value: string): string {
  const date = value.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return '—';
  }

  return date.replaceAll('-', '/');
}

export function formatReceiptPrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }

  return `NT$ ${value.toLocaleString('zh-TW')}`;
}

export function receiptPdfFileName(receiptNo: string): string {
  const safe = (receiptNo.trim() || '未編號').replace(/[\\/:*?"<>|]/g, '-');

  return `捐贈收據-${safe}.pdf`;
}

export function validateReceiptLines(lines: ReceiptLineItem[]): string | null {
  if (lines.length === 0) {
    return '請至少填一筆捐贈物資';
  }

  for (const [index, line] of lines.entries()) {
    const label = `第 ${index + 1} 筆物資`;

    if (!line.name.trim()) {
      return `請填寫${label}的品項名稱`;
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return `${label}的數量須為正整數`;
    }

    if (!line.unit.trim()) {
      return `請填寫${label}的單位`;
    }

    if (line.estimatedPrice === null || !Number.isFinite(line.estimatedPrice) || line.estimatedPrice < 0) {
      return `請填寫${label}的預估單價`;
    }
  }

  return null;
}

export interface DonorReceiptRequest {
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorIdNo: string;
  lines: ReceiptLineItem[];
  handoverMethod: string;
  agreed: boolean;
}

/** 捐助者送出前要核對的內容。機構章與完成日改由受贈單位開立時填。 */
export function validateDonorReceiptRequest(request: DonorReceiptRequest): string | null {
  if (!request.donorName.trim()) {
    return '請填寫捐助者姓名，收據會沿用這個名字';
  }

  if (request.donorEmail.trim() && !isReceiptEmail(request.donorEmail)) {
    return 'Email 格式不正確。不填也可以，受助機構不會看到信箱。';
  }

  if (!isTaiwanId(request.donorIdNo)) {
    return '請填寫有效的身分證字號。它只當作你的收據開啟密碼，受助機構看不到也不能改。';
  }

  if (!request.handoverMethod.trim()) {
    return '請選擇接送方式';
  }

  const lineError = validateReceiptLines(request.lines);

  if (lineError) {
    return lineError;
  }

  if (!request.agreed) {
    return '請先預覽收據，並勾選同意後再送出';
  }

  return null;
}

export interface AgencyReceiptIssue {
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorIdNo: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  lines: ReceiptLineItem[];
  handoverMethod: string;
  completedOn: string;
}

/** 捐助者更新密碼的時間比上次發送收據還新，受助者才要重做一次。 */
export function receiptNeedsResend(passwordChangedAt: string | null, pdfSentAt: string | null, issuedAt: string | null): boolean {
  if (!passwordChangedAt) {
    return false;
  }

  const sentAt = pdfSentAt || issuedAt;

  if (!sentAt) {
    return false;
  }

  const changed = Date.parse(passwordChangedAt);
  const sent = Date.parse(sentAt);

  return Number.isFinite(changed) && Number.isFinite(sent) && changed > sent;
}

export function validateAgencyReceiptIssue(issue: AgencyReceiptIssue): string | null {
  if (!issue.donorName.trim()) {
    return '請填寫捐助者姓名';
  }

  if (issue.donorEmail.trim() && !isReceiptEmail(issue.donorEmail)) {
    return '留存的 Email 格式不正確';
  }

  if (!isTaiwanId(issue.donorIdNo)) {
    return '捐助者還沒有設定開啟密碼，無法開立收據';
  }

  if (!issue.agencyName.trim() || !issue.agencyAddress.trim() || !issue.agencyPhone.trim()) {
    return '請填寫受贈機構名稱、地址與電話';
  }

  if (!issue.handoverMethod.trim()) {
    return '請填寫接送方式';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(issue.completedOn)) {
    return '請填寫捐贈完成日期';
  }

  return validateReceiptLines(issue.lines);
}

export function normalizeDonorId(value: string): string {
  return normalizeTaiwanId(value);
}

export interface ReceiptLogistics {
  deliveryAddress: string;
  logisticsCarrier: string;
  trackingNo: string;
}

/** 物流與配送地址先放在收據備註，避免再加資料表欄位。 */
export function packReceiptLogistics(value: ReceiptLogistics): string {
  return JSON.stringify({
    deliveryAddress: value.deliveryAddress.trim(),
    logisticsCarrier: value.logisticsCarrier.trim(),
    trackingNo: value.trackingNo.trim(),
  });
}

export function readReceiptLogistics(note: string | null | undefined): ReceiptLogistics {
  const empty = { deliveryAddress: '', logisticsCarrier: '', trackingNo: '' };

  if (!note?.trim()) {
    return empty;
  }

  try {
    const parsed = JSON.parse(note) as Partial<ReceiptLogistics>;

    if (!parsed || typeof parsed !== 'object' || !('logisticsCarrier' in parsed || 'deliveryAddress' in parsed)) {
      return empty;
    }

    return {
      deliveryAddress: String(parsed.deliveryAddress ?? ''),
      logisticsCarrier: String(parsed.logisticsCarrier ?? ''),
      trackingNo: String(parsed.trackingNo ?? ''),
    };
  } catch {
    return empty;
  }
}
