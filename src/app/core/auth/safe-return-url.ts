/** 只接受站內相對路徑，避免登入後被帶到外部網址。 */
export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const url = value.trim();

  if (!url.startsWith('/') || url.startsWith('//') || url.includes('\\') || url.includes('://')) {
    return null;
  }

  const path = url.split('#')[0]?.split('?')[0] ?? '';

  if (path === '/login' || path === '/register' || path.startsWith('/login/') || path.startsWith('/register/')) {
    return null;
  }

  return url;
}
