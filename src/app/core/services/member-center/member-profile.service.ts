import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  DonorAccountStatus,
  DonorLoginProvider,
  DonorProfile,
} from '../../../models/user/donor';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface DonorProfileRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  accountName: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  city: string | null;
  avatarUrl: string | null;
  loginProvider: string | null;
  accountStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface UpdateProfilePayload {
  displayName: string;
  accountName: string;
  fullName: string;
  phoneNumber: string;
  city: string;
}

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const TAIWAN_CITIES = [
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '台南市',
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
  '台東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
] as const;

@Injectable({
  providedIn: 'root',
})
export class MemberProfileService {
  private readonly tableName = 'donor_profiles';
  private readonly avatarBucket = 'member-avatars';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);
  private readonly router = inject(Router);

  private readonly profileSignal = signal<DonorProfile | null>(null);
  readonly profile = this.profileSignal.asReadonly();

  readonly cityOptions = TAIWAN_CITIES;

  async loadProfile(): Promise<DonorProfile> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').eq('uid', uid).maybeSingle();

    if (error) {
      console.error('讀取會員資料失敗：', error);
      throw error;
    }

    if (!data) {
      const created = await this.createDefaultProfile(uid);
      this.profileSignal.set(created);
      return created;
    }

    const profile = this.mapRowToProfile(data as DonorProfileRow);

    if (profile.accountStatus === 'DELETED') {
      this.profileSignal.set(null);
      throw new Error('此帳號已註銷');
    }

    this.profileSignal.set(profile);
    return profile;
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<DonorProfile> {
    const current = this.requireProfile();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update({
        displayName: payload.displayName.trim(),
        accountName: payload.accountName.trim() || null,
        fullName: payload.fullName.trim() || null,
        phoneNumber: payload.phoneNumber.trim() || null,
        city: payload.city.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('uid', current.uid)
      .eq('accountStatus', 'ACTIVE')
      .select('*')
      .single();

    if (error) {
      console.error('更新會員資料失敗：', error);
      throw error;
    }

    const profile = this.mapRowToProfile(data as DonorProfileRow);
    this.profileSignal.set(profile);

    return profile;
  }

  async uploadAvatar(file: File): Promise<DonorProfile> {
    if (!AVATAR_ACCEPT_TYPES.includes(file.type)) {
      throw new Error('僅支援 JPG、PNG、WEBP 格式的圖片');
    }

    if (file.size > AVATAR_MAX_BYTES) {
      throw new Error('圖片大小不可超過 2MB');
    }

    const current = this.requireProfile();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const storagePath = `${current.uid}/${Date.now()}.${extension}`;

    const { error: uploadError } = await this.supabaseService.client.storage
      .from(this.avatarBucket)
      .upload(storagePath, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('上傳大頭貼失敗：', uploadError);
      throw uploadError;
    }

    const { data: urlData } = this.supabaseService.client.storage.from(this.avatarBucket).getPublicUrl(storagePath);

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update({ avatarUrl: urlData.publicUrl, updatedAt: new Date().toISOString() })
      .eq('uid', current.uid)
      .select('*')
      .single();

    if (error) {
      console.error('更新大頭貼網址失敗：', error);
      throw error;
    }

    const profile = this.mapRowToProfile(data as DonorProfileRow);
    this.profileSignal.set(profile);

    return profile;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.session.getAuthUser();

    if (!user?.email) {
      throw new Error('目前尚未登入，無法修改密碼');
    }

    const { error: verifyError } = await this.supabaseService.client.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      throw new Error('目前密碼不正確');
    }

    const { error } = await this.supabaseService.client.auth.updateUser({ password: newPassword });

    if (error) {
      console.error('修改密碼失敗：', error);
      throw error;
    }

    const updatedAt = new Date().toISOString();
    const { error: stampError } = await this.supabaseService.client
      .from(this.tableName)
      .update({ passwordUpdatedAt: updatedAt, updatedAt })
      .eq('uid', user.id);

    if (stampError) {
      console.error('記錄密碼更新時間失敗：', stampError);
    }
  }

  /**
   * 註銷帳號（軟刪）：標記 DELETED、清除個資欄位，保留 uid 以維護歷史捐贈關聯。
   * 第三方／Auth 帳號刪除待登入串接後再一併呼叫 auth API。
   */
  async deleteAccount(): Promise<void> {
    const current = this.requireProfile();
    const deletedAt = new Date().toISOString();

    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .update({
        accountStatus: 'DELETED',
        deletedAt,
        displayName: '已註銷會員',
        accountName: null,
        fullName: null,
        phoneNumber: null,
        city: null,
        avatarUrl: null,
        email: '',
        updatedAt: deletedAt,
      })
      .eq('uid', current.uid)
      .eq('accountStatus', 'ACTIVE');

    if (error) {
      console.error('註銷帳號失敗：', error);
      throw error;
    }

    // 若已有 Auth session，嘗試登出（尚未登入則略過）
    await this.supabaseService.client.auth.signOut().catch(() => undefined);

    this.profileSignal.set(null);
    await this.router.navigateByUrl('/home');
  }

  private async createDefaultProfile(uid: string): Promise<DonorProfile> {
    const user = await this.session.getAuthUser();
    const email = user?.email ?? '';

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .insert({
        uid,
        email,
        displayName: email ? email.split('@')[0] : '新會員',
        loginProvider: 'email',
        accountStatus: 'ACTIVE',
      })
      .select('*')
      .single();

    if (error) {
      console.error('建立會員資料失敗：', error);
      throw error;
    }

    return this.mapRowToProfile(data as DonorProfileRow);
  }

  private requireProfile(): DonorProfile {
    const profile = this.profileSignal();

    if (!profile) {
      throw new Error('尚未載入會員資料');
    }

    return profile;
  }

  private mapRowToProfile(row: DonorProfileRow): DonorProfile {
    const provider = (row.loginProvider ?? 'email') as DonorLoginProvider;
    const status = (row.accountStatus ?? 'ACTIVE') as DonorAccountStatus;

    return {
      uid: row.uid,
      email: row.email ?? '',
      role: 'DONOR',
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
      displayName: row.displayName ?? '',
      accountName: row.accountName ?? undefined,
      fullName: row.fullName ?? undefined,
      phoneNumber: row.phoneNumber ?? undefined,
      city: row.city ?? undefined,
      avatarUrl: row.avatarUrl ?? undefined,
      loginProvider: ['email', 'google', 'line', 'facebook'].includes(provider) ? provider : 'email',
      accountStatus: status === 'DELETED' ? 'DELETED' : 'ACTIVE',
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}
