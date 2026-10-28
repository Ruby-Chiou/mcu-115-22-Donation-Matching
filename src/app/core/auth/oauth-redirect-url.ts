/**
 * 第三方登入完成後直接回首頁。登入頁沒有「登入成功」畫面，不該再停在那裡。
 * GitHub Pages 的網站在 /專案名稱/ 底下，路徑要帶上這個資料夾。
 */
export function oauthRedirectUrl(origin: string, baseHref: string | null | undefined): string {
  return sitePathUrl(origin, baseHref, '/home');
}

/** 重設密碼信裡的落地頁：登入頁，前端再用信內 token 呼叫 confirm-password-reset。 */
export function passwordResetPageUrl(origin: string, baseHref: string | null | undefined): string {
  return sitePathUrl(origin, baseHref, '/login');
}

function sitePathUrl(origin: string, baseHref: string | null | undefined, path: string): string {
  const base = (baseHref ?? '/').trim() || '/';
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  const prefix = withSlash === '/' ? '' : withSlash.slice(0, -1);
  const normalized = path.startsWith('/') ? path : `/${path}`;

  return `${origin}${prefix}${normalized}`;
}
