import { Injectable, inject, signal } from '@angular/core';

import { DEMO_BENEFICIARY_PLACES, isPlaceholderAddress } from '../../map/demo-beneficiary-places';
import { SupabaseService } from '../database/supabase.service';
import { BeneficiaryPublicProfile } from '../../../models/agency/beneficiary-public-profile';

const PUBLIC_COLUMNS =
  'agencyName, city, image, introImages, establishedYear, registrationLabel, serviceArea, serviceTargets, contactPhone, mission, background, verificationStatus, defaultAddress, websiteUrl, latitude, longitude';

const PUBLIC_COLUMNS_LEGACY =
  'agencyName, city, image, introImages, establishedYear, registrationLabel, serviceArea, serviceTargets, contactPhone, mission, background, verificationStatus';

const CITY_ORDER = ['臺北市', '新北市', '桃園市', '新竹縣', '臺中市', '南投縣', '臺南市', '高雄市', '宜蘭縣', '花蓮縣'];

interface BeneficiaryPublicProfileRow {
  agencyName: string;
  city: string;
  image: string | null;
  introImages: string[] | null;
  establishedYear: string | null;
  registrationLabel: string | null;
  serviceArea: string | null;
  serviceTargets: string[] | null;
  contactPhone: string | null;
  mission: string | null;
  background: string | null;
  verificationStatus: string | null;
  defaultAddress?: string | null;
  websiteUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BeneficiaryPublicField {
  label: string;
  value: string;
  href?: string;
}


@Injectable({
  providedIn: 'root',
})
export class BeneficiaryPublicProfileService {
  private readonly supabase = inject(SupabaseService);
  private readonly tableName = 'agency_public_profiles';
  private loadTask: Promise<void> | null = null;

  readonly profiles = signal<BeneficiaryPublicProfile[]>([]);
  readonly ready = signal(false);
  readonly loadError = signal('');

  ensureLoaded(): Promise<void> {
    if (!this.loadTask) {
      this.loadTask = this.fetchProfiles();
    }
    return this.loadTask;
  }

  /** 機構改完自己的資料後，清掉快取再讀一次公開視圖。 */
  refresh(): Promise<void> {
    this.loadTask = null;
    this.ready.set(false);
    return this.ensureLoaded();
  }

  list(): BeneficiaryPublicProfile[] {
    return this.profiles();
  }

  cities(): string[] {
    const present = new Set(this.profiles().map((profile) => profile.city));
    const known = CITY_ORDER.filter((city) => present.has(city));
    const extra = [...present].filter((city) => !CITY_ORDER.includes(city));
    return [...known, ...extra];
  }

  async findByUid(uid: string): Promise<BeneficiaryPublicProfile | null> {
    const trimmed = uid.trim();
    if (!trimmed) {
      return null;
    }

    const { data, error } = await this.selectOne(trimmed);
    if (error || !data) {
      return null;
    }

    return this.mapRow(data);
  }

  find(organizationName: string): BeneficiaryPublicProfile | null {
    const trimmed = organizationName.trim();
    if (!trimmed) {
      return null;
    }

    const profiles = this.profiles();
    return (
      profiles.find((profile) => profile.organizationName === trimmed) ??
      profiles.find((profile) => trimmed.includes(profile.organizationName)) ??
      null
    );
  }

  /** 名稱對不到時，改用地址裡的縣市對到資料庫那一筆。 */
  findForPlace(name: string, address = ''): BeneficiaryPublicProfile | null {
    const named = this.find(name);
    if (named) {
      return named;
    }

    const profiles = this.profiles();
    const normalized = address.replace(/台/g, '臺');
    const city = CITY_ORDER.find((item) => normalized.includes(item));
    return (city ? profiles.find((profile) => profile.city === city) : undefined) ?? null;
  }

  text(value: string | null | undefined): string {
    const trimmed = value?.trim() ?? '';
    return trimmed || '尚未公開';
  }

  fields(profile: BeneficiaryPublicProfile | null): BeneficiaryPublicField[] {
    return [
      { label: '受助機構', value: this.text(profile?.organizationName) },
      { label: '服務縣市', value: this.text(profile?.city) },
      { label: '登記地址', value: this.text(profile?.address) },
      {
        label: '官方網站',
        value: profile?.websiteUrl ? profile.websiteUrl : '尚未公開',
        href: this.httpHref(profile?.websiteUrl),
      },
      { label: '背景介紹', value: this.text(profile?.background) },
      { label: '服務宗旨', value: this.text(profile?.mission) },
      { label: '服務地區', value: this.text(profile?.serviceArea) },
      { label: '服務對象', value: profile?.serviceTargets.length ? profile.serviceTargets.join('、') : '尚未公開' },
      { label: '公開聯絡電話', value: this.text(profile?.publicPhone) },
      { label: '立案資料', value: this.text(profile?.registrationLabel) },
      { label: '成立年份', value: this.text(profile?.establishedYear) },
      { label: '資格狀態', value: profile ? (profile.verified ? '資格已確認' : '審核中') : '尚未公開' },
    ];
  }

  private async fetchProfiles(): Promise<void> {
    const { data, error } = await this.selectMany();

    if (error) {
      console.error('讀取受助機構公開資料失敗：', error);
      this.loadError.set('受助機構資料讀取失敗，請稍後再試。');
      this.ready.set(true);
      this.loadTask = null;
      return;
    }

    const rows = (data ?? []).map((row) => this.mapRow(row));
    rows.sort((left, right) => this.cityRank(left.city) - this.cityRank(right.city));
    this.profiles.set(rows);
    this.loadError.set('');
    this.ready.set(true);
  }

  private mapRow(row: BeneficiaryPublicProfileRow): BeneficiaryPublicProfile {
    return this.withDemoPlace({
      organizationName: row.agencyName,
      city: row.city,
      image: row.image ?? '',
      introImages: row.introImages ?? [],
      establishedYear: row.establishedYear ?? '',
      registrationLabel: row.registrationLabel ?? '',
      serviceArea: row.serviceArea ?? '',
      serviceTargets: row.serviceTargets ?? [],
      publicPhone: row.contactPhone ?? '',
      mission: row.mission ?? '',
      background: row.background ?? '',
      verified: row.verificationStatus === 'approved',
      address: row.defaultAddress ?? '',
      websiteUrl: row.websiteUrl ?? '',
      latitude: this.coordinate(row.latitude),
      longitude: this.coordinate(row.longitude),
    });
  }

  private async selectMany(): Promise<{ data: BeneficiaryPublicProfileRow[] | null; error: { message?: string; code?: string } | null }> {
    const first = await this.supabase.client.from(this.tableName).select(PUBLIC_COLUMNS);
    if (!first.error) {
      return { data: (first.data ?? []) as BeneficiaryPublicProfileRow[], error: null };
    }

    if (!this.missingMapColumn(first.error)) {
      return { data: null, error: first.error };
    }

    const legacy = await this.supabase.client.from(this.tableName).select(PUBLIC_COLUMNS_LEGACY);
    return {
      data: (legacy.data ?? []) as BeneficiaryPublicProfileRow[],
      error: legacy.error,
    };
  }

  private async selectOne(
    uid: string,
  ): Promise<{ data: BeneficiaryPublicProfileRow | null; error: { message?: string; code?: string } | null }> {
    const first = await this.supabase.client.from(this.tableName).select(PUBLIC_COLUMNS).eq('uid', uid).maybeSingle();
    if (!first.error) {
      return { data: (first.data as BeneficiaryPublicProfileRow | null) ?? null, error: null };
    }

    if (!this.missingMapColumn(first.error)) {
      return { data: null, error: first.error };
    }

    const legacy = await this.supabase.client.from(this.tableName).select(PUBLIC_COLUMNS_LEGACY).eq('uid', uid).maybeSingle();
    return {
      data: (legacy.data as BeneficiaryPublicProfileRow | null) ?? null,
      error: legacy.error,
    };
  }

  private missingMapColumn(error: { code?: string; message?: string }): boolean {
    const message = error.message ?? '';
    return error.code === 'PGRST204' || error.code === '42703' || /websiteUrl|latitude|longitude|defaultAddress/.test(message);
  }

  private httpHref(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  }

  private coordinate(value: number | null | undefined): number | null {
    return value != null && Number.isFinite(Number(value)) ? Number(value) : null;
  }

  /** 示範機構若還停在「示範路」，公開頁與地圖改用同一組地址、座標與官網。 */
  private withDemoPlace(profile: BeneficiaryPublicProfile): BeneficiaryPublicProfile {
    const demo = DEMO_BENEFICIARY_PLACES[profile.organizationName];
    if (!demo || !isPlaceholderAddress(profile.address)) {
      return profile;
    }

    return {
      ...profile,
      address: demo.address,
      websiteUrl: profile.websiteUrl.trim() || demo.websiteUrl,
      latitude: profile.latitude ?? demo.latitude,
      longitude: profile.longitude ?? demo.longitude,
    };
  }

  private cityRank(city: string): number {
    const index = CITY_ORDER.indexOf(city);
    return index === -1 ? CITY_ORDER.length : index;
  }
}
