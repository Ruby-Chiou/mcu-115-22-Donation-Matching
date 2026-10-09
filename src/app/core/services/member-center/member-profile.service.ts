import { Injectable, inject, signal } from '@angular/core';

import { DonorProfile } from '../../../models/user/donor';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface DonorProfileRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

export interface UpdateProfilePayload {
  displayName: string;
  phoneNumber: string;
}

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable({
  providedIn: 'root',
})
export class MemberProfileService {
  private readonly tableName = 'donor_profiles';
  private readonly avatarBucket = 'member-avatars';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  private readonly profileSignal = signal<DonorProfile | null>(null);
  readonly profile = this.profileSignal.asReadonly();

  async loadProfile(): Promise<DonorProfile> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').eq('uid', uid).maybeSingle();

    if (error) {
      console.error('讀取會員資料失敗：', error);
      throw error;
    }

    const profile = data ? this.mapRowToProfile(data as DonorProfileRow) : await this.createDefaultProfile(uid);

    this.profileSignal.set(profile);

    return profile;
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<DonorProfile> {
    const current = this.requireProfile();

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update({
        displayName: payload.displayName.trim(),
        phoneNumber: payload.phoneNumber.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('uid', current.uid)
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
    return {
      uid: row.uid,
      email: row.email ?? '',
      role: 'DONOR',
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      displayName: row.displayName ?? '',
      phoneNumber: row.phoneNumber ?? undefined,
      avatarUrl: row.avatarUrl ?? undefined,
    };
  }
}
