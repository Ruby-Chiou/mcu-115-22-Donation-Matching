export interface TaiwanCityView {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

/** 縣市大概中心。登記地址還沒有座標時，捐助地圖先標在這裡。 */
export const TAIWAN_CITY_VIEWS: TaiwanCityView[] = [
  { name: '臺北市', lat: 25.033, lng: 121.5654, zoom: 12 },
  { name: '新北市', lat: 24.9157, lng: 121.6739, zoom: 11 },
  { name: '桃園市', lat: 24.9936, lng: 121.301, zoom: 11 },
  { name: '臺中市', lat: 24.1477, lng: 120.6736, zoom: 11 },
  { name: '臺南市', lat: 22.9999, lng: 120.227, zoom: 11 },
  { name: '高雄市', lat: 22.6273, lng: 120.3014, zoom: 11 },
  { name: '基隆市', lat: 25.1283, lng: 121.7419, zoom: 13 },
  { name: '新竹市', lat: 24.8138, lng: 120.9675, zoom: 13 },
  { name: '新竹縣', lat: 24.8387, lng: 121.0177, zoom: 11 },
  { name: '宜蘭縣', lat: 24.757, lng: 121.753, zoom: 11 },
  { name: '苗栗縣', lat: 24.5602, lng: 120.8214, zoom: 11 },
  { name: '彰化縣', lat: 24.0518, lng: 120.5161, zoom: 11 },
  { name: '南投縣', lat: 23.961, lng: 120.9719, zoom: 10 },
  { name: '雲林縣', lat: 23.7092, lng: 120.4313, zoom: 11 },
  { name: '嘉義市', lat: 23.4801, lng: 120.4491, zoom: 13 },
  { name: '嘉義縣', lat: 23.4588, lng: 120.574, zoom: 11 },
  { name: '屏東縣', lat: 22.5519, lng: 120.5487, zoom: 10 },
  { name: '花蓮縣', lat: 23.9872, lng: 121.6016, zoom: 10 },
  { name: '臺東縣', lat: 22.7583, lng: 121.1444, zoom: 10 },
  { name: '澎湖縣', lat: 23.5711, lng: 119.5793, zoom: 11 },
  { name: '金門縣', lat: 24.4493, lng: 118.3766, zoom: 12 },
  { name: '連江縣', lat: 26.1505, lng: 119.9499, zoom: 12 },
];

export function sameTaiwanCity(left: string, right: string): boolean {
  return left.replace(/台/g, '臺').trim() === right.replace(/台/g, '臺').trim();
}

export function taiwanCityView(name: string): TaiwanCityView | undefined {
  return TAIWAN_CITY_VIEWS.find((city) => sameTaiwanCity(city.name, name));
}
