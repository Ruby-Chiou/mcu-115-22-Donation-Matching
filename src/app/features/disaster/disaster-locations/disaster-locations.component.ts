import { Component, AfterViewInit, OnDestroy, effect, signal, inject } from '@angular/core';
import * as L from 'leaflet';

import { HelperDemandService } from '../../../core/services/agency-helper-demand/helper-demand.service';
import { addTaiwanBasemap, fontMarkerIcon, releaseLeafletContainer } from '../../../core/map/leaflet-map';
import { escapeHtml, googleMapsSearchUrl } from '../../../core/map/map-links';
import { sameTaiwanCity, taiwanAddressRegion } from '../../../core/map/taiwan-cities';
import { HelperLocationFilterService } from '../../../core/services/disaster-control/helper-location-filter.service';

interface HelperMapLocation {
  id: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  needs: string[];
  mapsUrl: string;
}

@Component({
  selector: 'app-disaster-locations',
  standalone: true,
  imports: [],
  templateUrl: './disaster-locations.component.html',
  styleUrl: './disaster-locations.component.scss',
})
export class DisasterLocationsComponent implements AfterViewInit, OnDestroy {
  private readonly helperDemandService = inject(HelperDemandService);
  private readonly locationFilter = inject(HelperLocationFilterService);

  private map?: L.Map;
  private markers = new Map<number, L.Marker>();
  private resizeObserver?: ResizeObserver;
  private stopBasemap?: () => void;

  protected helperList: HelperMapLocation[] = [];
  private allHelperLocations: HelperMapLocation[] = [];
  protected readonly selectedLocation = signal<HelperMapLocation | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    effect(() => {
      this.locationFilter.selection();
      if (this.allHelperLocations.length > 0) {
        this.applyLocationFilter();
      }
    });
  }

  ngAfterViewInit(): void {
    const host = document.getElementById('disaster-map');
    if (!host) {
      this.loading.set(false);
      return;
    }

    releaseLeafletContainer(host);
    this.map = L.map(host, { fadeAnimation: false, zoomAnimation: false }).setView([23.7, 120.9], 7);
    this.stopBasemap = addTaiwanBasemap(this.map);
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(host);
    this.map.invalidateSize();

    void this.loadHelperLocations();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.stopBasemap?.();
    this.map?.remove();
    this.map = undefined;
  }

  protected showLocation(location: HelperMapLocation): void {
    if (!this.map) {
      return;
    }

    this.selectedLocation.set(location);
    this.map.flyTo([location.lat, location.lng], 15);
    this.markers.get(location.id)?.openPopup();
  }

  private async loadHelperLocations(): Promise<void> {
    const demands = await this.helperDemandService.listPublishedForMap();
    this.allHelperLocations = demands
      .filter(
        (demand) =>
          demand.latitude != null &&
          demand.longitude != null &&
          Number.isFinite(Number(demand.latitude)) &&
          Number.isFinite(Number(demand.longitude)),
      )
      .map((demand) => {
        const lat = Number(demand.latitude);
        const lng = Number(demand.longitude);
        return {
          id: Number(demand.id),
          name: demand.type || `協力需求 ${demand.serialNo}`,
          location: demand.location,
          lat,
          lng,
          needs: (demand.workContent || '')
            .split(/[\n,，、;；]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
          mapsUrl: googleMapsSearchUrl(demand.location, lat, lng),
        };
      });

    this.applyLocationFilter();
    this.loading.set(false);

    if (!this.map || this.helperList.length === 0) {
      return;
    }

    this.map.fitBounds(
      L.latLngBounds(this.helperList.map((item) => [item.lat, item.lng] as [number, number])),
      { padding: [50, 50], maxZoom: 12 },
    );
  }

  private applyLocationFilter(): void {
    const cities = this.locationFilter.selection().cities ?? [];
    this.helperList = this.allHelperLocations.filter((item) => {
      if (cities.length === 0) {
        return true;
      }
      const region = taiwanAddressRegion(item.location || '');
      return !!region.city && cities.some((city) => sameTaiwanCity(city, region.city));
    });
    this.showMarkers(this.helperList);

    if (this.selectedLocation() && !this.helperList.some((item) => item.id === this.selectedLocation()?.id)) {
      this.selectedLocation.set(null);
    }

    if (this.map && this.helperList.length > 0) {
      this.map.fitBounds(
        L.latLngBounds(this.helperList.map((item) => [item.lat, item.lng] as [number, number])),
        { padding: [50, 50], maxZoom: 12 },
      );
    }
  }

  private showMarkers(items: HelperMapLocation[]): void {
    if (!this.map) {
      return;
    }

    this.markers.forEach((marker) => this.map?.removeLayer(marker));
    this.markers.clear();

    items.forEach((item) => {
      if (!this.map) {
        return;
      }

      const needs = item.needs.length ? item.needs.map((need) => `・${escapeHtml(need)}`).join('<br>') : '尚未填寫';
      const marker = L.marker([item.lat, item.lng], { icon: fontMarkerIcon('helper') }).addTo(this.map).bindPopup(`
          <b>${escapeHtml(item.name)}</b><br><br>
          ${escapeHtml(item.location)}<br><br>
          <b>需要</b><br>${needs}<br><br>
          <a href="${escapeHtml(item.mapsUrl)}" target="_blank" rel="noopener noreferrer">用 Google 地圖開啟</a>
        `);
      this.markers.set(item.id, marker);
    });
  }
}
