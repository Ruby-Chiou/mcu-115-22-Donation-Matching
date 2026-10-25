/**
 * 第三方登入完成後直接回首頁。登入頁沒有「登入成功」畫面，不該再停在那裡。
 * GitHub Pages 的網站在 /專案名稱/ 底下，路徑要帶上這個資料夾。
 */
export function oauthRedirectUrl(origin: string, baseHref: string | null | undefined): string {
  const base = (baseHref ?? '/').trim() || '/';
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  const prefix = withSlash === '/' ? '' : withSlash.slice(0, -1);

  return `${origin}${prefix}/home`;
}
