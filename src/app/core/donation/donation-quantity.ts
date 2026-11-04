/** 捐助數量絕對上限：各單位（箱／件／人等）皆適用的合理上限。 */
export const DONATION_QUANTITY_ABSOLUTE_MAX = 9999;

export function clampDonationQuantity(value: number, remainingCap?: number | null): number {
  let next = Math.trunc(value);
  if (!Number.isFinite(next) || next < 1) {
    return 1;
  }

  const absolute = DONATION_QUANTITY_ABSOLUTE_MAX;
  const remaining =
    remainingCap === null || remainingCap === undefined || !Number.isFinite(remainingCap)
      ? absolute
      : Math.max(0, Math.trunc(remainingCap));

  const ceiling = Math.min(absolute, remaining > 0 ? remaining : absolute);
  return Math.min(next, ceiling);
}

/** 從 input 事件解析並夾限數量；回傳值供 UI 同步顯示。 */
export function applyDonationQuantityInput(
  raw: string,
  remainingCap?: number | null
): { quantity: number | null; display: string } {
  if (!raw) {
    return { quantity: null, display: '' };
  }

  const value = clampDonationQuantity(Number(raw), remainingCap);
  return { quantity: value, display: value.toString() };
}

/** 剩餘需求與通用上限取較小值；無剩餘資料時只用通用上限。 */
export function resolveDonationQuantityCap(remaining?: number | null): number {
  if (remaining === null || remaining === undefined || !Number.isFinite(remaining) || remaining <= 0) {
    return DONATION_QUANTITY_ABSOLUTE_MAX;
  }

  return Math.min(Math.trunc(remaining), DONATION_QUANTITY_ABSOLUTE_MAX);
}
