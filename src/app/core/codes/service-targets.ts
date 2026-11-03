/** 編輯表單固定勾選項（與 daily-form / batch-edit 一致） */
export const DAILY_SERVICE_TARGET_OPTIONS = [
  '老人',
  '嬰幼兒',
  '孩童',
  '青少年',
  '身障',
  '貧困',
  '重症照護',
  '動物',
  '無家者',
] as const;

const SERVICE_TARGET_ALIASES: Record<string, (typeof DAILY_SERVICE_TARGET_OPTIONS)[number]> = {
  老人: '老人',
  長者: '老人',
  長輩: '老人',
  嬰幼兒: '嬰幼兒',
  嬰兒: '嬰幼兒',
  幼兒: '嬰幼兒',
  孩童: '孩童',
  兒童: '孩童',
  青少年: '青少年',
  身障: '身障',
  身心障礙: '身障',
  障礙: '身障',
  貧困: '貧困',
  弱勢: '貧困',
  重症照護: '重症照護',
  重症: '重症照護',
  動物: '動物',
  無家者: '無家者',
  街友: '無家者',
};

export interface NormalizedServiceTargets {
  serviceTargets: string[];
  customServiceTargets: string[];
}

/**
 * 把資料庫裡的需求對象對回表單勾選項；對不上的放到「其他需求對象」。
 */
export function normalizeServiceTargets(
  serviceTargets: unknown,
  customServiceTargets: unknown = [],
): NormalizedServiceTargets {
  const fixed = new Set<string>();
  const customs: string[] = [];

  const pushValue = (raw: unknown): void => {
    const value = String(raw ?? '').trim();
    if (!value) {
      return;
    }

    const mapped = SERVICE_TARGET_ALIASES[value];
    if (mapped) {
      fixed.add(mapped);
      return;
    }

    if (!customs.includes(value)) {
      customs.push(value);
    }
  };

  const walk = (input: unknown): void => {
    if (input == null) {
      return;
    }

    if (Array.isArray(input)) {
      input.forEach((item) => walk(item));
      return;
    }

    if (typeof input === 'object') {
      Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
        if (value === true || value === 'true' || value === 1) {
          pushValue(key);
        } else if (typeof value === 'string') {
          pushValue(value);
        } else {
          pushValue(key);
        }
      });
      return;
    }

    pushValue(input);
  };

  walk(serviceTargets);
  walk(customServiceTargets);

  return {
    serviceTargets: [...fixed],
    customServiceTargets: customs.length > 0 ? customs : [''],
  };
}
