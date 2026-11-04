const MAX_DEMAND_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 需求圖上傳規則（邏輯層只回傳錯誤文字，不直接 alert）。 */
export function validateDemandImageUpload(currentCount: number, file: File): string | null {
  if (currentCount >= MAX_DEMAND_IMAGES) {
    return '最多只能上傳 5 張圖片';
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return '圖片大小不可超過 5MB';
  }

  return null;
}
