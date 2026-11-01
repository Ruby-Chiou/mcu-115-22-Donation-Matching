/**
 * 需求欄位以代碼儲存，畫面再對應中文，避免 big-5 / utf-8 混用時欄位比對失敗。
 * 讀取時同時接受代碼與舊的中文值。
 */

export type PriorityCode = 'P1' | 'P2' | 'P3';
export type PriorityLabel = '非常緊急' | '緊急' | '普通';

const PRIORITY_BY_CODE: Record<PriorityCode, PriorityLabel> = {
  P1: '非常緊急',
  P2: '緊急',
  P3: '普通',
};

const PRIORITY_RANK: Record<string, number> = {
  P1: 1,
  非常緊急: 1,
  P2: 2,
  緊急: 2,
  P3: 3,
  普通: 3,
};

export function priorityLabel(value: string | null | undefined): PriorityLabel {
  if (!value) {
    return '普通';
  }
  if (value === 'P1' || value === 'P2' || value === 'P3') {
    return PRIORITY_BY_CODE[value];
  }
  if (value === '非常緊急' || value === '緊急' || value === '普通') {
    return value;
  }
  return '普通';
}

export function priorityCode(value: string | null | undefined): PriorityCode {
  const label = priorityLabel(value);
  if (label === '非常緊急') return 'P1';
  if (label === '緊急') return 'P2';
  return 'P3';
}

/** 數字越小越緊急。未知值排最後。 */
export function priorityRank(value: string | null | undefined): number {
  return PRIORITY_RANK[value ?? ''] ?? 99;
}

export type DemandSortMode = 'priority-then-newest' | 'newest-then-priority';

export function itemTimestamp(item: { publishedAt?: string; createdAt?: string }): number {
  return Date.parse(item.publishedAt || item.createdAt || '') || 0;
}

/** 緊急度優先，同緊急度再依最新上架。 */
export function sortByPriorityThenDate<T extends { priority?: string; publishedAt?: string; createdAt?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const rankDiff = priorityRank(a.priority) - priorityRank(b.priority);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return itemTimestamp(b) - itemTimestamp(a);
  });
}

/** 最新上架優先，同時間再依緊急度。 */
export function sortByNewestThenPriority<T extends { priority?: string; publishedAt?: string; createdAt?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const timeDiff = itemTimestamp(b) - itemTimestamp(a);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return priorityRank(a.priority) - priorityRank(b.priority);
  });
}

export function sortDemands<T extends { priority?: string; publishedAt?: string; createdAt?: string }>(
  items: T[],
  mode: DemandSortMode = 'priority-then-newest',
): T[] {
  return mode === 'newest-then-priority' ? sortByNewestThenPriority(items) : sortByPriorityThenDate(items);
}

/** 篩選比對時同時接受中文與代碼。 */
export function priorityMatches(selected: string[], value: string | null | undefined): boolean {
  if (selected.length === 0) {
    return true;
  }
  const label = priorityLabel(value);
  const code = priorityCode(value);
  return selected.some((item) => item === label || item === code || priorityLabel(item) === label);
}
