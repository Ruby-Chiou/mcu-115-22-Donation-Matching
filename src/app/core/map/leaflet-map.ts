import * as L from 'leaflet';

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export type FontMarkerKind = 'agency' | 'volunteer' | 'user';

/** 用 Font Awesome，避免 Leaflet 預設針圖檔載入失敗。 */
export function fontMarkerIcon(kind: FontMarkerKind): L.DivIcon {
  const glyph = kind === 'user' ? 'fa-location-crosshairs' : kind === 'volunteer' ? 'fa-hand-holding-heart' : 'fa-location-dot';
  const anchor = kind === 'user' ? 18 : 36;

  return L.divIcon({
    className: `font-marker font-marker-${kind}`,
    html: `<i class="fa-solid ${glyph}" aria-hidden="true"></i>`,
    iconSize: [36, 36],
    iconAnchor: [18, anchor],
    popupAnchor: [0, kind === 'user' ? -18 : -32],
  });
}

/**
 * 開發時熱更新會把舊地圖留在同一個 div 上，再次建立會丟出 already initialized。
 * 先清掉標記，地圖才開得起來。
 */
export function releaseLeafletContainer(element: HTMLElement): void {
  const marked = element as HTMLElement & { _leaflet_id?: number };
  if (marked._leaflet_id != null) {
    delete marked._leaflet_id;
  }
}

/**
 * 國土測繪中心的圖磚沒有分流網址，一張常常要 1 到 2 秒，
 * 畫面又要一次抓十幾張，地圖會先灰很久。
 * OpenStreetMap 有 a/b/c 三個網址可以並行，標記還是用我們自己的座標。
 */
export function addTaiwanBasemap(map: L.Map): () => void {
  const tiles = L.tileLayer(OSM_TILES, {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: 'abc',
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 0,
  });
  tiles.addTo(map);
  return () => undefined;
}
