import { DisasterOpenPageComponent } from '../../../components/page/disaster-open-page/disaster-open-page.component';
import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { RouterLink } from '@angular/router';
// Leaflet Marker 圖示
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
  selector: 'app-disaster-open',
  imports: [DisasterOpenPageComponent],
  templateUrl: './disaster-open.component.html',
  styleUrl: './disaster-open.component.scss',
})
export class DisasterOpenComponent {
   map!: L.Map;


  // 目前顯示的 Marker
  currentMarkers: L.Marker[] = [];


  // =========================
  // 需要志工的地點
  // =========================

  volunteerList = [
  {
    name: '花蓮縣光復鄉衛生所',
    location:'📍花蓮縣光復鄉大馬村中學街158號',
    lat: 23.671898,
    lng: 121.425941,
    needs: [
      '物資搬運',
      '環境清潔',
      '災民陪伴'
    ]
  },

  {
    name: '花蓮縣立光復國民中學',
    location:'📍花蓮縣光復鄉大馬村林森路200號',
    lat: 23.670939,
    lng: 121.426511,
    needs: [
      '物資整理',
      '物資搬運'
    ]
  },

  {
    name: '花蓮縣鳳林鎮長橋國民小學',
    location:'📍花蓮縣鳳林鎮長橋里長橋路2號',
    lat: 23.709583,
    lng:  121.419539,
    needs: [
      '災民服務',
      '物資發放',
      '環境整理'
    ]
  }
];


  // =========================
  // 需要捐助的地點
  // =========================

  donationList = [
  {
    name: '花蓮縣光復鄉衛生所',
    location:'📍花蓮縣光復鄉大馬村中學街158號',
    lat: 23.671898,
    lng: 121.425941,
    needs: [
      '飲用水',
      '泡麵',
      '罐頭食品'
    ]
  },

  {
    name: '花蓮縣光復鄉西南社區發展協會',
    location:'📍花蓮縣光復鄉南富村建國路二段111號',
    lat: 23.658455,
    lng: 121.449389,
    needs: [
      '奶粉',
      '尿布',
      '衛生用品'
    ]
  },

  {
    name: '大進國小災民收容所',
    location:'📍花蓮縣光復鄉大進村糖廠街2號',
    lat: 23.654699,
    lng: 121.419135,
    needs: [
      '礦泉水',
      '乾糧',
      '清潔用品'
    ]
  }
];


  // =========================
  // 建立地圖
  // =========================

  ngAfterViewInit() {

    this.map = L.map('map')
      .setView([23.7, 120.9], 7);


    // 國土測繪中心地圖
    L.tileLayer(
      'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
      {
        attribution: '國土測繪中心'
      }
    ).addTo(this.map);

    // 修正地圖拼圖、位置錯亂
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);

  }


  // =========================
  // 清除目前 Marker
  // =========================

  clearMarkers() {

    this.currentMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });

    this.currentMarkers = [];

  }


  // =========================
  // 顯示志工地點
  // =========================

  showVolunteers() {

  this.clearMarkers();

  this.volunteerList.forEach(item => {

    const marker = L.marker([
      item.lat,
      item.lng
    ])
    .addTo(this.map)
    .bindPopup(`
      <b>${item.name}</b>
      <br><br>
      <b>${item.location}</b>
      <br><br>

      <b>目前需要志工</b>

      <br><br>

      <b>需要：</b>

      <br>

      ・${item.needs.join('<br>・')}

    `);

    this.currentMarkers.push(marker);

  });

}


  // =========================
  // 顯示捐助地點
  // =========================

  showDonations() {

  this.clearMarkers();

  this.donationList.forEach(item => {

    const marker = L.marker([
      item.lat,
      item.lng
    ])
    .addTo(this.map)
    .bindPopup(`
      <b>${item.name}</b>
      <br><br>
      <b>${item.location}</b>
      <br><br>

      <b>目前需要捐助</b>

      <br><br>

      <b>需要：</b>

      <br>

      ・${item.needs.join('<br>・')}

    `);

    this.currentMarkers.push(marker);

  });

}


  // =========================
  // 下拉選單
  // =========================

  selectType(event: any) {

    const type = event.target.value;


    if (type === 'volunteer') {

      this.showVolunteers();

    }
    else if (type === 'donation') {

      this.showDonations();

    }
    else {

      this.clearMarkers();

    }

  }

}
