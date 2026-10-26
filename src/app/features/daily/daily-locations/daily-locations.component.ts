import { Component, AfterViewInit, OnDestroy, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { BeneficiaryPublicProfileService } from '../../../core/services/agency/beneficiary-public-profile.service';
import { BeneficiaryPublicProfile } from '../../../models/agency/beneficiary-public-profile';
import { addTaiwanBasemap, fontMarkerIcon, releaseLeafletContainer } from '../../../core/map/leaflet-map';
import { appHref, escapeHtml, googleMapsSearchUrl } from '../../../core/map/map-links';
import { TAIWAN_CITY_VIEWS, TaiwanCityView, sameTaiwanCity, taiwanCityView } from '../../../core/map/taiwan-cities';

interface MapPlace {
  name: string;
  city: string;
  location: string;
  lat: number | null;
  lng: number | null;
  details: string[];
  websiteUrl: string;
  mapsUrl: string;
  profileUrl: string;
  distanceKm: number | null;
  distanceLabel: string;
}

@Component({
  selector: 'app-daily-locations',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './daily-locations.component.html',
  styleUrl: './daily-locations.component.scss',
})
export class DailyLocationsComponent implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly profiles = inject(BeneficiaryPublicProfileService);

  private map?: L.Map;
  private markers = new Map<string, L.Marker>();
  private userMarker?: L.Marker;
  private viewKey = '';
  private geoJsonData: object | null = null;
  private geojsonLayer: L.GeoJSON | null = null;
  private resizeObserver?: ResizeObserver;
  private stopBasemap?: () => void;

  protected readonly cityList: TaiwanCityView[] = TAIWAN_CITY_VIEWS;
  protected readonly ready = this.profiles.ready;
  protected readonly loadError = this.profiles.loadError;
  protected readonly selectedCity = signal('');
  protected readonly displayList = signal<MapPlace[]>([]);
  protected readonly listMessage = signal('機構資料載入中...');
  protected readonly locatePrompt = signal<'ask' | 'pending' | 'hidden'>('ask');
  protected readonly locateNote = signal('');
  protected readonly userPoint = signal<{ lat: number; lng: number } | null>(null);

  constructor() {
    void this.profiles.ensureLoaded();
    effect(() => {
      const ready = this.profiles.ready();
      const rows = this.profiles.profiles();
      const city = this.selectedCity();
      const user = this.userPoint();
      if (!this.map) {
        return;
      }
      this.renderPlaces(rows, city, ready, user);
    });
  }

  ngAfterViewInit(): void {
    const host = document.getElementById('map');
    if (!host) {
      return;
    }

    releaseLeafletContainer(host);
    this.map = L.map(host, { fadeAnimation: false, zoomAnimation: false }).setView([23.7, 120.9], 7);
    this.renderPlaces(this.profiles.profiles(), this.selectedCity(), this.profiles.ready(), this.userPoint());
    this.stopBasemap = addTaiwanBasemap(this.map);

    this.http.get<object>('https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json').subscribe({
      next: (data) => {
        this.geoJsonData = data;
        const city = this.selectedCity();
        if (city) {
          this.highlightCityBoundary(city);
        }
      },
      error: (err) => console.error('GeoJSON 載入失敗:', err),
    });

    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(host);
    this.map.invalidateSize();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.stopBasemap?.();
    this.map?.remove();
    this.map = undefined;
  }

  selectCity(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.selectedCity.set(target?.value ?? '');
  }

  skipLocate(): void {
    this.locatePrompt.set('hidden');
    this.locateNote.set('未定位。可改選縣市，或稍後再按「定位我的位置」。');
  }

  allowLocate(): void {
    if (!navigator.geolocation) {
      this.locatePrompt.set('hidden');
      this.locateNote.set('這台裝置沒有提供定位，仍可依縣市查看機構。');
      return;
    }

    this.locatePrompt.set('pending');
    this.locateNote.set('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userPoint.set({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        this.locatePrompt.set('hidden');
        this.locateNote.set('已依你的位置，由近到遠排列附近的社福機構。');
      },
      () => {
        this.locatePrompt.set('hidden');
        this.locateNote.set('沒有取得位置。可以再按一次「定位我的位置」，或改選縣市。');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  focusLocation(item: MapPlace): void {
    if (!this.map || item.lat == null || item.lng == null) {
      return;
    }

    this.map.setView([item.lat, item.lng], 15);
    this.markers.get(item.name)?.openPopup();
  }

  private renderPlaces(
    rows: BeneficiaryPublicProfile[],
    cityName: string,
    ready: boolean,
    user: { lat: number; lng: number } | null,
  ): void {
    if (!this.map) {
      return;
    }

    const places = rows.map((profile) => this.toPlace(profile, user));
    const visible = cityName ? places.filter((place) => sameTaiwanCity(place.city, cityName)) : places;
    if (user) {
      visible.sort((left, right) => (left.distanceKm ?? Number.POSITIVE_INFINITY) - (right.distanceKm ?? Number.POSITIVE_INFINITY));
    }
    this.displayList.set(visible);

    if (!ready) {
      this.listMessage.set('機構資料載入中...');
    } else if (this.loadError()) {
      this.listMessage.set(this.loadError());
    } else if (cityName) {
      this.listMessage.set('這個縣市目前沒有受助機構。');
    } else {
      this.listMessage.set('目前沒有可顯示的受助機構。');
    }

    this.clearMarkers();
    visible.forEach((place) => {
      if (!this.map || place.lat == null || place.lng == null) {
        return;
      }

      const marker = L.marker([place.lat, place.lng], { icon: fontMarkerIcon('agency') }).addTo(this.map).bindPopup(this.popup(place));
      this.markers.set(place.name, marker);
    });
    this.syncUserMarker(user);
    this.applyView(cityName, user, visible);
  }

  private applyView(cityName: string, user: { lat: number; lng: number } | null, visible: MapPlace[]): void {
    if (!this.map) {
      return;
    }

    const key = user && !cityName ? `user:${user.lat.toFixed(4)},${user.lng.toFixed(4)}` : cityName ? `city:${cityName}` : 'all';
    if (key === this.viewKey) {
      return;
    }
    this.viewKey = key;

    if (user && !cityName) {
      this.clearBoundary();
      this.map.setView([user.lat, user.lng], 12);
      return;
    }

    if (!cityName) {
      this.clearBoundary();
      if (visible.length > 0) {
        const points = visible.filter((place) => place.lat != null && place.lng != null).map((place) => [place.lat, place.lng] as [number, number]);
        if (points.length > 0) {
          this.map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 11 });
        }
      } else {
        this.map.setView([23.7, 120.9], 7);
      }
      return;
    }

    const city = taiwanCityView(cityName);
    if (city) {
      this.map.setView([city.lat, city.lng], city.zoom);
    }
    this.highlightCityBoundary(cityName);
  }

  private syncUserMarker(user: { lat: number; lng: number } | null): void {
    this.userMarker?.remove();
    this.userMarker = undefined;
    if (!this.map || !user) {
      return;
    }

    this.userMarker = L.marker([user.lat, user.lng], { icon: fontMarkerIcon('user'), zIndexOffset: 1000 })
      .addTo(this.map)
      .bindPopup('你的位置');
  }

  private toPlace(profile: BeneficiaryPublicProfile, user: { lat: number; lng: number } | null): MapPlace {
    const city = taiwanCityView(profile.city);
    const lat = profile.latitude ?? city?.lat ?? null;
    const lng = profile.longitude ?? city?.lng ?? null;
    const location = profile.address.trim() || profile.city;

    const kilometers = user && lat != null && lng != null ? distanceKm(user.lat, user.lng, lat, lng) : null;

    return {
      name: profile.organizationName,
      city: profile.city,
      location,
      lat,
      lng,
      details: profile.serviceTargets,
      websiteUrl: profile.websiteUrl,
      mapsUrl: googleMapsSearchUrl(location, lat, lng),
      profileUrl: appHref(`/donor/beneficiaries/${encodeURIComponent(profile.organizationName)}`),
      distanceKm: kilometers,
      distanceLabel: kilometers == null ? '' : formatDistance(kilometers),
    };
  }

  private popup(place: MapPlace): string {
    const needs = place.details.length ? place.details.map((item) => `・${escapeHtml(item)}`).join('<br>') : '尚未公開';
    const website = place.websiteUrl
      ? `<a href="${escapeHtml(place.websiteUrl)}" target="_blank" rel="noopener noreferrer">官方網站</a>`
      : '尚未提供官網';

    return `
      <b>${escapeHtml(place.name)}</b><br><br>
      ${escapeHtml(place.location)}<br><br>
      <b>服務對象</b><br>${needs}<br><br>
      <a href="${escapeHtml(place.mapsUrl)}" target="_blank" rel="noopener noreferrer">Google 地圖</a>
      ｜ ${website}
      ｜ <a href="${escapeHtml(place.profileUrl)}">機構資料</a>
    `;
  }

  private clearMarkers(): void {
    this.markers.forEach((marker) => this.map?.removeLayer(marker));
    this.markers.clear();
  }

  private clearBoundary(): void {
    if (this.geojsonLayer && this.map) {
      this.map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = null;
    }
  }

  private highlightCityBoundary(cityName: string): void {
    this.clearBoundary();
    if (!this.map || !this.geoJsonData || !cityName) {
      return;
    }

    const altName = cityName.replace('臺', '台');
    this.geojsonLayer = L.geoJSON(this.geoJsonData as never, {
      filter: (feature) => {
        const props = (feature.properties ?? {}) as Record<string, string>;
        const geoName = props['COUNTYNAME'] || props['COUNTY_NAME'] || props['COUNTYSTRING'] || props['name'] || '';
        if (geoName === cityName || geoName === altName) {
          return true;
        }
        if (cityName.includes('桃園')) {
          return geoName.includes('桃園');
        }
        return false;
      },
      style: {
        color: getComputedStyle(document.documentElement).getPropertyValue('--color-link-bright').trim(),
        weight: 3,
        opacity: 0.8,
        fillColor: getComputedStyle(document.documentElement).getPropertyValue('--color-map-fill').trim(),
        fillOpacity: 0.25,
      },
    }).addTo(this.map);

    if (this.geojsonLayer.getLayers().length > 0) {
      this.map.fitBounds(this.geojsonLayer.getBounds(), { padding: [20, 20], maxZoom: 12 });
    }
  }
}

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const earthRadiusKm = 6371;
  const latDelta = ((toLat - fromLat) * Math.PI) / 180;
  const lngDelta = ((toLng - fromLng) * Math.PI) / 180;
  const from = (fromLat * Math.PI) / 180;
  const to = (toLat * Math.PI) / 180;
  const arc = Math.sin(latDelta / 2) ** 2 + Math.cos(from) * Math.cos(to) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.asin(Math.sqrt(arc));
}

function formatDistance(kilometers: number): string {
  if (kilometers < 1) {
    return `約 ${Math.max(1, Math.round(kilometers * 1000))} 公尺`;
  }
  if (kilometers < 10) {
    return `約 ${kilometers.toFixed(1)} 公里`;
  }
  return `約 ${Math.round(kilometers)} 公里`;
}
