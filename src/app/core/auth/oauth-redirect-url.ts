/**
 * 第三方登入完成後要回到的登入頁。
 * GitHub Pages 的網站在 /專案名稱/ 底下，不能只用網域加 /login。
 */
export function oauthRedirectUrl(origin: string, baseHref: string | null | undefined): string {
  const base = (baseHref ?? '/').trim() || '/';
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  const prefix = withSlash === '/' ? '' : withSlash.slice(0, -1);

  return `${origin}${prefix}/login`;
}
