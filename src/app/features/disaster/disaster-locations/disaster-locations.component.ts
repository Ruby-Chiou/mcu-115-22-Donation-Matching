import { Component, AfterViewInit, signal, inject } from '@angular/core';
import * as L from 'leaflet';

import { VolunteerDemandService } from '../../../core/services/agency-volunteer-demand/volunteer-demand.service';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface VolunteerMapLocation {
  id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  needs: string[];
}

@Component({
  selector: 'app-disaster-locations',
  standalone: true,
  imports: [],
  templateUrl: './disaster-locations.component.html',
  styleUrl: './disaster-locations.component.scss',
})
export class DisasterLocationsComponent implements AfterViewInit {
  private readonly volunteerDemandService = inject(VolunteerDemandService);

  private map!: L.Map;
  private currentMarkers: L.Marker[] = [];

  protected volunteerList: VolunteerMapLocation[] = [];

  protected readonly selectedLocation = signal<VolunteerMapLocation | null>(null);

  ngAfterViewInit(): void {
    this.map = L.map('disaster-map');

    L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
      attribution: '國土測繪中心',
    }).addTo(this.map);

    // 從資料服務載入志工需求
    void this.loadVolunteerLocations();

    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  private async loadVolunteerLocations(): Promise<void> {
    try {
      // 等待志工需求資料載入完成
      await this.volunteerDemandService.waitUntilLoaded();

      const demands = this.volunteerDemandService.getVolunteers();

      // 取得具有有效經緯度的需求
      this.volunteerList = demands
        .filter(
          (demand) =>
            demand.latitude != null &&
            demand.longitude != null &&
            Number.isFinite(Number(demand.latitude)) &&
            Number.isFinite(Number(demand.longitude))
        )
        .map((demand) => ({
          id: Number(demand.id),
          name: demand.type || `志工需求 ${demand.serialNo}`,
          location: demand.location,
          lat: Number(demand.latitude),
          lng: Number(demand.longitude),
          needs: (demand.workContent || '')
            .split(/[\n,，、;；]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        }));

      // 地圖仍顯示全部需求的標記
      this.showMarkers(this.volunteerList, '志工需求');

      // 地圖初始範圍依照全部需求計算
      if (this.volunteerList.length > 0) {
        const bounds = L.latLngBounds(this.volunteerList.map((item) => [item.lat, item.lng] as [number, number]));

        this.map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
        });
      }
    } catch (error) {
      console.error('載入地圖志工需求失敗：', error);
    }
  }

  // 定位至選定需求，地圖上的全部標記仍保留
  protected showLocation(location: VolunteerMapLocation): void {
    this.selectedLocation.set(location);

    this.map.flyTo([location.lat, location.lng], 15);

    const index = this.volunteerList.findIndex((item) => item.id === location.id);

    this.currentMarkers[index]?.openPopup();
  }

  private showMarkers(items: VolunteerMapLocation[], title: string): void {
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
    this.currentMarkers.forEach((marker) => {
      this.map.removeLayer(marker);
    });

    this.currentMarkers = [];
  }
}
