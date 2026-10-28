import { Injectable, inject } from '@angular/core';

import { BeneficiaryPublicProfileService } from '../../core/services/agency/beneficiary-public-profile.service';
import { SupabaseService } from '../../core/services/database/supabase.service';
import { BeneficiaryPublicProfile } from '../../models/agency/beneficiary-public-profile';

import { CommentAuthorRole } from './comment-author.data';

export type DonorCardKind = 'individual' | 'company';

export interface AuthorThank {
  item: string;
  agencyName: string;
  publishedAt: string;
}

export interface DonorAuthorCard {
  type: 'donor';
  donorKind: DonorCardKind;
  city: string;
  thanks: AuthorThank[];
}

export interface AgencyAuthorCard {
  type: 'agency';
  profile: BeneficiaryPublicProfile;
}

export type AuthorCard = DonorAuthorCard | AgencyAuthorCard;

interface DonorCardRow {
  city: string | null;
  donor_kind: string | null;
}

interface ThankRow {
  donationItem: string | null;
  agencyName: string | null;
  publishedAt: string | null;
}

const DONOR_SAMPLES = new Map<string, DonorAuthorCard>([
  [
    '11111111-1111-4111-8111-111111111111',
    {
      type: 'donor',
      donorKind: 'individual',
      city: '宜蘭縣',
      thanks: [
        { item: '白米 20 包', agencyName: '宜蘭家庭資源中心', publishedAt: '2026-10-11T05:00:00.000Z' },
        { item: '罐頭 12 箱', agencyName: '宜蘭家庭資源中心', publishedAt: '2026-09-02T05:00:00.000Z' },
      ],
    },
  ],
  [
    '55555555-5555-4555-8555-555555555555',
    {
      type: 'donor',
      donorKind: 'individual',
      city: '台北市',
      thanks: [{ item: '礦泉水 5 箱', agencyName: '宜蘭家庭資源中心', publishedAt: '2026-10-18T05:00:00.000Z' }],
    },
  ],
  [
    '44444444-4444-4444-8444-444444444444',
    {
      type: 'donor',
      donorKind: 'company',
      city: '新北市',
      thanks: [{ item: '白米 50 包', agencyName: '宜蘭家庭資源中心', publishedAt: '2026-10-18T05:00:00.000Z' }],
    },
  ],
]);

const AGENCY_SAMPLE: BeneficiaryPublicProfile = {
  organizationName: '測試受助機構',
  city: '宜蘭縣',
  image: '',
  introImages: [],
  establishedYear: '2015',
  registrationLabel: '府社團字第104056號',
  serviceArea: '宜蘭縣宜蘭市、礁溪鄉',
  serviceTargets: ['兒童', '新住民家庭'],
  publicPhone: '03-932-7700',
  mission: '讓宜蘭的家庭找得到資源',
  background: '整理兒童與新住民家庭的生活需求，服務據點在宜蘭市與礁溪。民眾可依縣市篩選，找到住家附近的受助單位。',
  verified: true,
  address: '',
  websiteUrl: '',
  latitude: null,
  longitude: null,
};

@Injectable({
  providedIn: 'root',
})
export class CommentAuthorCardService {
  private readonly supabase = inject(SupabaseService);
  private readonly agencies = inject(BeneficiaryPublicProfileService);

  async load(userId: string, role: CommentAuthorRole, name: string): Promise<AuthorCard> {
    if (role === 'agency') {
      return this.loadAgency(userId, name);
    }

    return this.loadDonor(userId);
  }

  private async loadDonor(userId: string): Promise<AuthorCard> {
    const sample = DONOR_SAMPLES.get(userId);
    const [profile, thanks] = await Promise.all([this.readDonorCard(userId), this.readThanks(userId)]);

    return {
      type: 'donor',
      donorKind: profile?.donorKind ?? sample?.donorKind ?? 'individual',
      city: profile?.city || sample?.city || '',
      thanks: thanks.length > 0 ? thanks : (sample?.thanks ?? []),
    };
  }

  private async loadAgency(userId: string, name: string): Promise<AuthorCard> {
    const fromDatabase = await this.readAgency(userId);

    if (fromDatabase) {
      return { type: 'agency', profile: fromDatabase };
    }

    await this.agencies.ensureLoaded();
    const named = this.agencies.find(name);

    if (named) {
      return { type: 'agency', profile: named };
    }

    if (userId === '22222222-2222-4222-8222-222222222222') {
      return { type: 'agency', profile: { ...AGENCY_SAMPLE, organizationName: name || AGENCY_SAMPLE.organizationName } };
    }

    return {
      type: 'agency',
      profile: {
        ...AGENCY_SAMPLE,
        organizationName: name || '受助機構',
        city: '',
        establishedYear: '',
        registrationLabel: '',
        serviceArea: '',
        serviceTargets: [],
        publicPhone: '',
        mission: '',
        background: '',
        verified: false,
        address: '',
        websiteUrl: '',
        latitude: null,
        longitude: null,
      },
    };
  }

  private async readDonorCard(userId: string): Promise<{ city: string; donorKind: DonorCardKind } | null> {
    const fromView = await this.supabase.client.from('donor_public_cards').select('city, donor_kind').eq('uid', userId).maybeSingle();

    if (!fromView.error && fromView.data) {
      const row = fromView.data as DonorCardRow;
      return {
        city: row.city?.trim() ?? '',
        donorKind: row.donor_kind === 'company' ? 'company' : 'individual',
      };
    }

    const fallback = await this.supabase.client.from('donor_profiles').select('city').eq('uid', userId).maybeSingle();

    if (fallback.error || !fallback.data) {
      return null;
    }

    return {
      city: String((fallback.data as { city?: string | null }).city ?? '').trim(),
      donorKind: DONOR_SAMPLES.get(userId)?.donorKind ?? 'individual',
    };
  }

  private async readThanks(userId: string): Promise<AuthorThank[]> {
    const { data, error } = await this.supabase.client
      .from('public_donation_thanks')
      .select('donationItem, agencyName, publishedAt')
      .eq('donorUid', userId)
      .eq('isPublic', true)
      .order('publishedAt', { ascending: false })
      .limit(5);

    if (error) {
      return [];
    }

    return ((data ?? []) as ThankRow[]).map((row) => ({
      item: row.donationItem?.trim() || '捐贈物資',
      agencyName: row.agencyName?.trim() || '受助機構',
      publishedAt: row.publishedAt ?? '',
    }));
  }

  private readAgency(userId: string): Promise<BeneficiaryPublicProfile | null> {
    return this.agencies.findByUid(userId);
  }
}
