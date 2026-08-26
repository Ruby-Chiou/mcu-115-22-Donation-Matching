import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

// 修正 Leaflet 預設 Marker 圖示遺失的問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

export interface VolunteerItem {
  name: string;
  location: string;
  lat: number;
  lng: number;
  needs: string[];
}

export interface CityItem {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

@Component({
  selector: 'app-daily-locations',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './daily-locations.component.html',
  styleUrl: './daily-locations.component.scss',
})
export class DailyLocationsComponent implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);

  map!: L.Map;
  currentMarkers: L.Marker[] = [];
  geoJsonData: any = null;
  geojsonLayer: L.GeoJSON | null = null;
  private resizeObserver!: ResizeObserver;

  // 目前頁面側邊欄顯示的需求機構清單
  displayList: VolunteerItem[] = [];

  // 需求地點清單
  volunteerList: VolunteerItem[] = [
    {
      name: '華山基金會',
      location: '📍臺北市士林區中正路420號7樓',
      lat: 25.093419,
      lng: 121.519570,
      needs: ['清潔用品']
    },
    {
      name: '勵馨基金會',
      location: '📍臺北市大安區羅斯福路二段75號8樓',
      lat: 25.026359,
      lng: 121.523107,
      needs: ['奶粉']
    },
    {
      name: '臺灣關愛基金會',
      location: '📍高雄市三民區本揚里黃興路39號',
      lat: 22.646324,
      lng: 120.343439,
      needs: ['嬰幼童用品']
    }
  ];

  // 縣市清單
  cityList: CityItem[] = [
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
    { name: '連江縣', lat: 26.1505, lng: 119.9499, zoom: 12 }
  ];

  ngAfterViewInit() {
    this.map = L.map('map').setView([23.7, 120.9], 7);

    L.tileLayer(
      'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
      { attribution: '國土測繪中心' }
    ).addTo(this.map);

    this.http.get('https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json')
      .subscribe({
        next: (data: any) => {
          this.geoJsonData = data;
        },
        error: (err) => console.error('GeoJSON 載入失敗:', err)
      });

    const mapEl = document.getElementById('map');
    if (mapEl) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      });
      this.resizeObserver.observe(mapEl);
    }

    this.displayList = [...this.volunteerList];
    this.renderMarkers(this.displayList);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  clearMarkers() {
    this.currentMarkers.forEach(marker => this.map.removeLayer(marker));
    this.currentMarkers = [];
  }

  renderMarkers(items: VolunteerItem[]) {
    this.clearMarkers();

    items.forEach(item => {
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

  // 繪製與高亮縣市邊界圖層
  highlightCityBoundary(cityName: string) {
    if (this.geojsonLayer) {
      this.map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = null;
    }

    if (!this.geoJsonData || !cityName) return;

    const altName = cityName.replace('臺', '台');

    this.geojsonLayer = L.geoJSON(this.geoJsonData, {
      filter: (feature) => {
        const props = feature.properties || {};
        const geoName = props.COUNTYNAME || props.COUNTY_NAME || props.COUNTYSTRING || props.name || '';

        // 1. 完全比對 (優先比對正確的全稱，避免嘉義縣/嘉義市混淆)
        if (geoName === cityName || geoName === altName) {
          return true;
        }

        // 2. 針對「桃園」等升格縣市的特殊比對
        if (cityName.includes('桃園')) {
          return geoName.includes('桃園');
        }

        return geoName.includes(cityName) || geoName.includes(altName);
      },
      style: {
        color: '#2563eb',
        weight: 3,
        opacity: 0.8,
        fillColor: '#99c3f7',
        fillOpacity: 0.25
      }
    }).addTo(this.map);

    if (this.geojsonLayer.getLayers().length > 0) {
      this.map.fitBounds(this.geojsonLayer.getBounds(), {
        padding: [20, 20],
        maxZoom: 13
      });
    }
  }

  selectCity(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (!target) return;

    const cityName = target.value;

    if (!cityName) {
      if (this.geojsonLayer) {
        this.map.removeLayer(this.geojsonLayer);
        this.geojsonLayer = null;
      }
      this.map.setView([23.7, 120.9], 7);
      this.displayList = [...this.volunteerList];
      this.renderMarkers(this.displayList);
      return;
    }

    this.highlightCityBoundary(cityName);

    const keyword = cityName.replace('臺', '台');

    // 精準篩選地點 (避免嘉義市匹配到嘉義縣)
    const filteredList = this.volunteerList.filter(item => {
      const nameMatch = item.name.includes(cityName) || item.name.includes(keyword);
      const locationMatch = item.location.includes(cityName) || item.location.includes(keyword);
      return nameMatch || locationMatch;
    });

    this.displayList = filteredList.length > 0 ? filteredList : this.volunteerList;
    this.renderMarkers(this.displayList);
  }

  focusLocation(item: VolunteerItem) {
    this.map.setView([item.lat, item.lng], 15);
    const targetMarker = this.currentMarkers.find(m => {
      const latlng = m.getLatLng();
      return latlng.lat === item.lat && latlng.lng === item.lng;
    });
    if (targetMarker) {
      targetMarker.openPopup();
    }
  }
}
