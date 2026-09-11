import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { RouterLink } from '@angular/router';
// Leaflet Marker 圖示修復
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

@Component({
  selector: 'app-daily-locations',
  imports: [],
  templateUrl: './daily-locations.component.html',
  styleUrl: './daily-locations.component.scss',
})
export class DailyLocationsComponent implements AfterViewInit, OnDestroy {
  map!: L.Map;
  currentMarkers: L.Marker[] = [];
  private resizeObserver!: ResizeObserver;

  // 需求地點清單
  volunteerList = [
    {
      name: '華山基金會',
      location: '📍台北市士林區中正路420號7樓',
      lat: 25.093419,
      lng: 121.519570,
      needs: ['清潔用品']
    },
    {
      name: '勵馨基金會',
      location: '📍台北市大安區羅斯福路二段75號8樓',
      lat: 25.026359,
      lng: 121.523107,
      needs: ['奶粉']
    },
    {
      name: '台灣關愛基金會',
      location: '📍高雄市三民區本揚里黃興路39號',
      lat: 22.646324,
      lng: 120.343439,
      needs: ['嬰幼童用品']
    }
  ];

  // 縣市清單與預設中心座標
  cityList = [
  // 直轄市
  { name: '臺北市', lat: 25.0330, lng: 121.5654, zoom: 12 },
  { name: '新北市', lat: 24.9157, lng: 121.6739, zoom: 11 },
  { name: '桃園市', lat: 24.9936, lng: 121.3010, zoom: 11 },
  { name: '臺中市', lat: 24.1477, lng: 120.6736, zoom: 11 },
  { name: '臺南市', lat: 22.9999, lng: 120.2270, zoom: 11 },
  { name: '高雄市', lat: 22.6273, lng: 120.3014, zoom: 11 },

  // 北部縣市
  { name: '基隆市', lat: 25.1283, lng: 121.7419, zoom: 13 },
  { name: '新竹市', lat: 24.8138, lng: 120.9675, zoom: 13 },
  { name: '新竹縣', lat: 24.8387, lng: 121.0177, zoom: 11 },
  { name: '宜蘭縣', lat: 24.7570, lng: 121.7530, zoom: 11 },

  // 中部縣市
  { name: '苗栗縣', lat: 24.5602, lng: 120.8214, zoom: 11 },
  { name: '彰化縣', lat: 24.0518, lng: 120.5161, zoom: 11 },
  { name: '南投縣', lat: 23.9610, lng: 120.9719, zoom: 10 },
  { name: '雲林縣', lat: 23.7092, lng: 120.4313, zoom: 11 },

  // 南部縣市
  { name: '嘉義市', lat: 23.4801, lng: 120.4491, zoom: 13 },
  { name: '嘉義縣', lat: 23.4588, lng: 120.5740, zoom: 11 },
  { name: '屏東縣', lat: 22.5519, lng: 120.5487, zoom: 10 },

  // 東部縣市
  { name: '花蓮縣', lat: 23.9872, lng: 121.6016, zoom: 10 },
  { name: '臺東縣', lat: 22.7583, lng: 121.1444, zoom: 10 },

  // 離島地區
  { name: '澎湖縣', lat: 23.5711, lng: 119.5793, zoom: 11 },
  { name: '金門縣', lat: 24.4493, lng: 118.3766, zoom: 12 },
  { name: '連江縣', lat: 26.1505, lng: 119.9499, zoom: 12 } // 馬祖
];

  ngAfterViewInit() {
    this.map = L.map('map').setView([23.7, 120.9], 7);

    // 國土測繪中心地圖
    L.tileLayer(
      'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
      { attribution: '國土測繪中心' }
    ).addTo(this.map);

    // 自動監聽 DOM 容器變動，防止地圖拼圖錯位或跑版
    const mapEl = document.getElementById('map');
    if (mapEl) {
      this.resizeObserver = new ResizeObserver(() => {
        this.map.invalidateSize();
      });
      this.resizeObserver.observe(mapEl);
    }

    // 預設載入所有地點
    this.showVolunteers();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  // 清除目前所有 Marker
  clearMarkers() {
    this.currentMarkers.forEach(marker => this.map.removeLayer(marker));
    this.currentMarkers = [];
  }

  // 顯示所有需求地點
  showVolunteers() {
    this.clearMarkers();

    this.volunteerList.forEach(item => {
      const marker = L.marker([item.lat, item.lng])
        .addTo(this.map)
        .bindPopup(`
          <b>${item.name}</b><br><br>
          <b>${item.location}</b><br><br>
          <b>目前需要幫助：</b><br>
          ・${item.needs.join('<br>・')}
        `);

      this.currentMarkers.push(marker);
    });
  }

  // 顯示指定縣市的需求地點
  showCityNeeds(cityName: string) {
    this.clearMarkers();

    const volunteerNeeds = this.volunteerList.filter(item =>
      item.name.includes(cityName) || item.location.includes(cityName)
    );

    volunteerNeeds.forEach(item => {
      const marker = L.marker([item.lat, item.lng])
        .addTo(this.map)
        .bindPopup(`
          <b>${item.name}</b><br><br>
          <b>${item.location}</b><br><br>
          <b>目前需要志工：</b><br>
          ・${item.needs.join('<br>・')}
        `);

      this.currentMarkers.push(marker);
    });
  }

  // 選單切換縣市時呼叫
 selectCity(event: any) {
  const cityName = event.target.value;

  // 1. 若選擇「請選擇縣市」（空值），回到全台視角並顯示所有 Marker
  if (!cityName) {
    this.map.setView([23.7, 120.9], 7);
    this.showVolunteers();
    return;
  }

  // 2. 找尋該縣市的中心座標與 Zoom
  const city = this.cityList.find(item => item.name === cityName);

  if (city) {
    // 3. 移動地圖到該縣市
    this.map.setView([city.lat, city.lng], city.zoom);

    // 4. 保持顯示所有地點（或者只顯示該縣市地點，看你的需求）
    // 如果你要全部地點都保留，請呼叫 showVolunteers()：
    this.showVolunteers();
  }
}
}
