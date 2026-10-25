export interface GeoPoint {
  latitude: number;
  longitude: number;
  displayName: string;
}

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

/** 去掉縣市與門牌，留下路名，供 Nominatim 較容易命中。 */
export function taiwanRoadName(address: string): string {
  let road = address.trim().replace(/臺/g, '台');
  road = road.replace(/\d+(?:-\d+)?(?:之\d+)?號.*$/, '');
  road = road.replace(/^.*?[市縣]/, '');
  road = road.replace(/^.*?[區鄉鎮市]/, '');
  return road.trim();
}

/** 向 Nominatim 查一筆台灣地址。找不到或逾時時回傳 null。 */
export async function geocodeTaiwan(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'tw');
  url.searchParams.set('q', /taiwan/i.test(trimmed) ? trimmed : `${trimmed}, Taiwan`);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
    const latitude = Number(rows[0]?.lat);
    const longitude = Number(rows[0]?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      displayName: rows[0]?.display_name ?? '',
    };
  } catch {
    return null;
  }
}
