/** 優先度 → CSS class（避免各頁重複 switch）。 */

export function dailyPriorityClass(priority: string | undefined): string {
  switch (priority) {
    case '非常緊急':
    case 'P1':
      return 'priority-urgent';
    case '緊急':
    case 'P2':
      return 'priority-normal';
    case '普通':
    case 'P3':
      return 'priority-low';
    default:
      return 'priority-default';
  }
}

export function disasterPriorityClass(priority: string | undefined): string {
  switch (priority) {
    case '非常緊急':
      return 'very-urgent';
    case '緊急':
      return 'urgent';
    default:
      return 'normal';
  }
}
