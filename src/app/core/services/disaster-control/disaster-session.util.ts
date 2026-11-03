/** 災害捐助動作頁（詳情／表單等），關閉時必須立刻退出。 */
export function isDonorDisasterActionUrl(url: string): boolean {
  const path = (url.split('?')[0] ?? '').replace(/\/$/, '') || '/';
  return path.startsWith('/donor/disaster/');
}

/** 災害捐助者專區（含大廳）。 */
export function isDonorDisasterAreaUrl(url: string): boolean {
  const path = (url.split('?')[0] ?? '').replace(/\/$/, '') || '/';
  return path === '/donor/disaster' || path.startsWith('/donor/disaster/') || path.startsWith('/disaster/open');
}
