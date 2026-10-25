/** 平台客服信箱。聯絡頁與客訴通知都用這一組。 */
export const SUPPORT_EMAIL = 'donation.matching1113@gmail.com';

export const SUPPORT_CATEGORIES = [
  { value: 'account', label: '帳號與登入' },
  { value: 'donation', label: '捐助相關' },
  { value: 'logistics', label: '物流相關' },
  { value: 'disaster', label: '災害救助' },
  { value: 'system', label: '平台使用問題' },
  { value: 'other', label: '其他問題' },
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['value'];

export function supportCategoryLabel(value: string): string {
  return SUPPORT_CATEGORIES.find((item) => item.value === value)?.label ?? '其他問題';
}
