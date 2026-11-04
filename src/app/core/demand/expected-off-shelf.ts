/** 依緊急度計算預計下架日（OCP：新增優先度只需改對應天數表）。 */

export type DemandPriorityLabel = '普通' | '緊急' | '非常緊急';

export const DAILY_OFF_SHELF_DAYS: Record<DemandPriorityLabel, number> = {
  普通: 60,
  緊急: 30,
  非常緊急: 14,
};

export const DISASTER_OFF_SHELF_DAYS: Record<DemandPriorityLabel, number> = {
  普通: 30,
  緊急: 14,
  非常緊急: 7,
};

export const HELPER_OFF_SHELF_DAYS: Record<DemandPriorityLabel, number> = {
  普通: 14,
  緊急: 7,
  非常緊急: 3,
};

export function calculateExpectedOffShelfAt(
  publishedDate: Date,
  priority: string | undefined,
  daysByPriority: Record<string, number>
): string {
  const offShelfDate = new Date(publishedDate);
  const days = priority ? daysByPriority[priority] : undefined;

  if (typeof days === 'number' && Number.isFinite(days)) {
    offShelfDate.setDate(offShelfDate.getDate() + days);
  }

  return offShelfDate.toISOString();
}
