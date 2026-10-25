/**
 * 受助機構展示區那 10 筆示範單位的登記地址。
 * 資料庫還是「某縣市示範路 1 號」時，公開頁與捐助地圖都改看這裡，避免兩邊各講一套。
 * 座標來自可查到的門牌；埔里安四街在開放街圖沒有門牌，標記先放埔里鎮中心，Google 地圖連結仍用完整地址。
 */
export interface DemoBeneficiaryPlace {
  address: string;
  latitude: number;
  longitude: number;
  websiteUrl: string;
}

export const DEMO_BENEFICIARY_PLACES: Record<string, DemoBeneficiaryPlace> = {
  示範社福機構: {
    address: '臺北市中山區南京東路二段132號',
    latitude: 25.0517841,
    longitude: 121.5336704,
    websiteUrl: '',
  },
  暖陽社會福利協會: {
    address: '新北市板橋區中山路一段161號',
    latitude: 25.0125017,
    longitude: 121.4654477,
    websiteUrl: '',
  },
  愛心關懷基金會: {
    address: '桃園市桃園區縣府路1號',
    latitude: 24.9932463,
    longitude: 121.3009813,
    websiteUrl: '',
  },
  竹北家庭支持協會: {
    address: '新竹縣竹北市縣政二路103號',
    latitude: 24.8268655,
    longitude: 121.0157225,
    websiteUrl: '',
  },
  希望兒少關懷中心: {
    address: '臺中市西屯區惠來路二段101號',
    latitude: 24.16284,
    longitude: 120.64095,
    websiteUrl: '',
  },
  博幼基金會: {
    address: '南投縣埔里鎮安四街131號',
    latitude: 23.9666667,
    longitude: 120.9691462,
    websiteUrl: 'https://www.boyo.org.tw/boyoV2/',
  },
  臺南安平長照中心: {
    address: '臺南市安平區古堡街108號',
    latitude: 23.0034521,
    longitude: 120.1597942,
    websiteUrl: '',
  },
  高雄港都福利協會: {
    address: '高雄市前鎮區中山三路43號',
    latitude: 22.6047112,
    longitude: 120.3078006,
    websiteUrl: '',
  },
  宜蘭家庭資源中心: {
    address: '宜蘭縣宜蘭市縣政北路1號',
    latitude: 24.7304129,
    longitude: 121.7631313,
    websiteUrl: '',
  },
  花蓮光復關懷站: {
    address: '花蓮縣光復鄉中華路257號',
    latitude: 23.6694087,
    longitude: 121.4232928,
    websiteUrl: '',
  },
};

export function isPlaceholderAddress(address: string): boolean {
  const trimmed = address.trim();
  return !trimmed || trimmed.includes('示範路');
}
