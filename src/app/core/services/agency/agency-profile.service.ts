import { Injectable, inject, signal } from '@angular/core';

import { AgencyProfile } from '../../../models/user/agency';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from '../member-center/member-session.service';

export const AGENCY_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const AGENCY_IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
export const AGENCY_INTRO_IMAGE_LIMIT = 6;

export const AGENCY_CITY_OPTIONS = [
  '臺北市',
  '新北市',
  '桃園市',
  '臺中市',
  '臺南市',
  '高雄市',
  '基隆市',
  '新竹市',
  '嘉義市',
  '新竹縣',
  '苗栗縣',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義縣',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
] as const;

/** 機構自己可以改的欄位。信箱、資格狀態與帳號狀態由系統保留。 */
export interface AgencyProfileDraft {
  agencyName: string;
  registrationNumber: string;
  representative: string;
  contactPhone: string;
  defaultAddress: string;
  contactPersonName: string;
  contactPersonTitle: string;
  department: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  verificationDocumentUrl: string;
  consentToContact: boolean;
  city: string;
  image: string;
  introImages: string[];
  establishedYear: string;
  registrationLabel: string;
  serviceArea: string;
  serviceTargets: string[];
  mission: string;
  background: string;
}

interface AgencyProfileRow {
  uid: string;
  email: string | null;
  agencyName: string | null;
  registrationNumber: string | null;
  representative: string | null;
  contactPhone: string | null;
  defaultAddress: string | null;
  contactPersonName: string | null;
  contactPersonTitle: string | null;
  department: string | null;
  contactPersonPhone: string | null;
  contactPersonEmail: string | null;
  verificationDocumentUrl: string | null;
  verificationStatus: string | null;
  consentToContact: boolean | null;
  agreeToTerms: boolean | null;
  city: string | null;
  image: string | null;
  introImages: string[] | null;
  establishedYear: string | null;
  registrationLabel: string | null;
  serviceArea: string | null;
  serviceTargets: string[] | null;
  mission: string | null;
  background: string | null;
  accountStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AgencyProfileService {
  private readonly supabase = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);
  private readonly tableName = 'agency_profiles';
  private readonly imageBucket = 'agency-intro';

  readonly profile = signal<AgencyProfile | null>(null);

  async loadOwn(): Promise<AgencyProfile> {
    const uid = await this.session.getCurrentUid();
    const { data, error } = await this.supabase.client.from(this.tableName).select('*').eq('uid', uid).maybeSingle();

    if (error) {
      console.error('讀取機構資料失敗：', error);
      throw error;
    }

    const row = (data as AgencyProfileRow | null) ?? (await this.createOwn(uid));
    if (row.accountStatus === 'DELETED') {
      throw new Error('此機構帳號已停用');
    }

    const profile = this.mapRow(row);
    this.profile.set(profile);
    return profile;
  }

  async save(draft: AgencyProfileDraft): Promise<AgencyProfile> {
    const current = this.requireProfile();
    const introImages = draft.introImages.map((item) => item.trim()).filter(Boolean).slice(0, AGENCY_INTRO_IMAGE_LIMIT);
    const serviceTargets = draft.serviceTargets.map((item) => item.trim()).filter(Boolean);

    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .update({
        agencyName: draft.agencyName.trim(),
        registrationNumber: draft.registrationNumber.trim(),
        representative: draft.representative.trim(),
        contactPhone: draft.contactPhone.trim(),
        defaultAddress: draft.defaultAddress.trim(),
        contactPersonName: draft.contactPersonName.trim(),
        contactPersonTitle: draft.contactPersonTitle.trim(),
        department: draft.department.trim(),
        contactPersonPhone: draft.contactPersonPhone.trim(),
        contactPersonEmail: draft.contactPersonEmail.trim(),
        verificationDocumentUrl: draft.verificationDocumentUrl.trim(),
        consentToContact: draft.consentToContact,
        city: draft.city.trim(),
        image: draft.image.trim(),
        introImages,
        establishedYear: draft.establishedYear.trim(),
        registrationLabel: draft.registrationLabel.trim(),
        serviceArea: draft.serviceArea.trim(),
        serviceTargets,
        mission: draft.mission.trim(),
        background: draft.background.trim(),
        updatedAt: new Date().toISOString(),
      })
      .eq('uid', current.uid)
      .select('*')
      .single();

    if (error) {
      console.error('儲存機構資料失敗：', error);
      throw error;
    }

    const profile = this.mapRow(data as AgencyProfileRow);
    this.profile.set(profile);
    return profile;
  }

  async uploadPublicImage(file: File): Promise<string> {
    if (!AGENCY_IMAGE_ACCEPT.includes(file.type)) {
      throw new Error('僅支援 JPG、PNG、WEBP 格式的圖片');
    }

    if (file.size > AGENCY_IMAGE_MAX_BYTES) {
      throw new Error('圖片大小不可超過 2MB');
    }

    const current = this.requireProfile();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const storagePath = `${current.uid}/${Date.now()}.${extension}`;
    const { error } = await this.supabase.client.storage.from(this.imageBucket).upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error('上傳介紹圖片失敗：', error);
      throw error;
    }

    return this.supabase.client.storage.from(this.imageBucket).getPublicUrl(storagePath).data.publicUrl;
  }

  draftFrom(profile: AgencyProfile): AgencyProfileDraft {
    return {
      agencyName: profile.agencyName,
      registrationNumber: profile.registrationNumber,
      representative: profile.representative,
      contactPhone: profile.contactPhone,
      defaultAddress: profile.defaultAddress,
      contactPersonName: profile.contactPersonName,
      contactPersonTitle: profile.contactPersonTitle,
      department: profile.department,
      contactPersonPhone: profile.contactPersonPhone,
      contactPersonEmail: profile.contactPersonEmail,
      verificationDocumentUrl: profile.verificationDocumentUrl,
      consentToContact: profile.consentToContact,
      city: profile.city,
      image: profile.image,
      introImages: [...profile.introImages],
      establishedYear: profile.establishedYear,
      registrationLabel: profile.registrationLabel,
      serviceArea: profile.serviceArea,
      serviceTargets: [...profile.serviceTargets],
      mission: profile.mission,
      background: profile.background,
    };
  }

  private async createOwn(uid: string): Promise<AgencyProfileRow> {
    const user = await this.session.getAuthUser();
    const email = user?.email ?? '';
    const agencyName = email ? email.split('@')[0] : '未命名機構';
    const { data, error } = await this.supabase.client
      .from(this.tableName)
      .insert({
        uid,
        email,
        agencyName,
        agreeToTerms: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('建立機構資料失敗：', error);
      throw error;
    }

    return data as AgencyProfileRow;
  }

  private requireProfile(): AgencyProfile {
    const profile = this.profile();
    if (!profile) {
      throw new Error('尚未載入機構資料');
    }
    return profile;
  }

  private mapRow(row: AgencyProfileRow): AgencyProfile {
    const status = row.verificationStatus === 'approved' || row.verificationStatus === 'rejected' ? row.verificationStatus : 'pending';

    return {
      uid: row.uid,
      email: row.email ?? '',
      role: 'AGENCY',
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
      agencyName: row.agencyName ?? '',
      registrationNumber: row.registrationNumber ?? '',
      representative: row.representative ?? '',
      contactPhone: row.contactPhone ?? '',
      defaultAddress: row.defaultAddress ?? '',
      contactPersonName: row.contactPersonName ?? '',
      contactPersonTitle: row.contactPersonTitle ?? '',
      department: row.department ?? '',
      contactPersonPhone: row.contactPersonPhone ?? '',
      contactPersonEmail: row.contactPersonEmail ?? '',
      verificationDocumentUrl: row.verificationDocumentUrl ?? '',
      verificationStatus: status,
      consentToContact: row.consentToContact ?? false,
      agreeToTerms: row.agreeToTerms ?? false,
      city: row.city ?? '',
      image: row.image ?? '',
      introImages: row.introImages ?? [],
      establishedYear: row.establishedYear ?? '',
      registrationLabel: row.registrationLabel ?? '',
      serviceArea: row.serviceArea ?? '',
      serviceTargets: row.serviceTargets ?? [],
      mission: row.mission ?? '',
      background: row.background ?? '',
    };
  }
}
