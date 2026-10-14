import { Component, AfterViewInit, signal } from '@angular/core';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

@Component({
  selector: 'app-disaster-locations',
  standalone: true,
  imports: [],
  templateUrl: './disaster-locations.component.html',
  styleUrl: './disaster-locations.component.scss',
})
export class DisasterLocationsComponent implements AfterViewInit {
  private map!: L.Map;
  private currentMarkers: L.Marker[] = [];

  protected readonly volunteerList = [
    {
      name: '花蓮縣光復鄉衛生所',
      location: '花蓮縣光復鄉大馬村中學街158號',
      lat: 23.671898,
      lng: 121.425941,
      needs: ['物資搬運', '環境清潔', '災民陪伴'],
    },
    {
      name: '花蓮縣立光復國民中學',
      location: '花蓮縣光復鄉大馬村林森路200號',
      lat: 23.670939,
      lng: 121.426511,
      needs: ['物資整理', '物資搬運'],
    },
    {
      name: '花蓮縣鳳林鎮長橋國民小學',
      location: '花蓮縣鳳林鎮長橋里長橋路2號',
      lat: 23.709583,
      lng: 121.419539,
      needs: ['災民服務', '物資發放', '環境整理'],
    },
  ];
  protected readonly selectedLocation = signal<(typeof this.volunteerList)[number] | null>(null);

  ngAfterViewInit(): void {
    this.map = L.map('disaster-map');

    L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
      attribution: '國土測繪中心',
    }).addTo(this.map);

    // 一開啟就顯示 Marker
    this.showMarkers(this.volunteerList, '志工需求');

    // 自動調整地圖範圍，讓所有 Marker 都看得到
    const bounds = L.latLngBounds(this.volunteerList.map((item) => [item.lat, item.lng] as [number, number]));

    this.map.fitBounds(bounds, {
      padding: [50, 50],
    });

    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  protected showLocation(location: (typeof this.volunteerList)[number]): void {
    this.selectedLocation.set(location);
    this.map.flyTo([location.lat, location.lng], 15);
    this.currentMarkers[this.volunteerList.indexOf(location)]?.openPopup();
  }

  private showMarkers(items: typeof this.volunteerList, title: string): void {
    this.clearMarkers();
    items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng]).addTo(this.map).bindPopup(`
        <b>${item.name}</b><br><br>
        <b>${item.location}</b><br><br>
        <b>${title}</b><br><br>
        <b>需要：</b><br>
        ・${item.needs.join('<br>・')}
      `);
      this.currentMarkers.push(marker);
    });
  }

  private clearMarkers(): void {
    this.currentMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.currentMarkers = [];
  }
}
