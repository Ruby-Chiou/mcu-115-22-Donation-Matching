/** 空字串代表沒填。null 代表填了但不是可用的 http(s) 網址。 */
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function googleMapsSearchUrl(address: string, latitude?: number | null, longitude?: number | null): string {
  const query =
    address.trim() ||
    (latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? `${latitude},${longitude}`
      : '');

  if (!query) {
    return '';
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function appHref(path: string): string {
  const base = document.querySelector('base')?.getAttribute('href') || '/';
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${prefix}${path.startsWith('/') ? path : `/${path}`}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
