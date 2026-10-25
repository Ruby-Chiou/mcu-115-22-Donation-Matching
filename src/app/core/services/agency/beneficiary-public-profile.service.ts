import { Injectable, inject, signal } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';
import { BeneficiaryPublicProfile } from '../../../models/agency/beneficiary-public-profile';

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
}

export interface BeneficiaryPublicField {
  label: string;
  value: string;
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
    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .select(
        'agencyName, city, image, introImages, establishedYear, registrationLabel, serviceArea, serviceTargets, contactPhone, mission, background, verificationStatus',
      );

    if (error) {
      console.error('讀取受助機構公開資料失敗：', error);
      this.loadError.set('受助機構資料讀取失敗，請稍後再試。');
      this.ready.set(true);
      this.loadTask = null;
      return;
    }

    const rows = ((data ?? []) as BeneficiaryPublicProfileRow[]).map((row) => this.mapRow(row));
    rows.sort((left, right) => this.cityRank(left.city) - this.cityRank(right.city));
    this.profiles.set(rows);
    this.loadError.set('');
    this.ready.set(true);
  }

  private mapRow(row: BeneficiaryPublicProfileRow): BeneficiaryPublicProfile {
    return {
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
    };
  }

  private cityRank(city: string): number {
    const index = CITY_ORDER.indexOf(city);
    return index === -1 ? CITY_ORDER.length : index;
  }
}
