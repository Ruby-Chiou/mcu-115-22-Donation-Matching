import { Injectable, inject, signal } from '@angular/core';

import {
  ChannelToggles,
  EmailDigestMode,
  MemberNotificationSettings,
  NotificationSettingsUpdate,
  defaultNotificationSettings,
} from '../../../models/member/notification-settings';
import { SupabaseService } from '../database/supabase.service';
import { MemberSessionService } from './member-session.service';

interface NotificationSettingsRow {
  uid: string;
  inAppSystem: boolean | null;
  inAppAgency: boolean | null;
  inAppDonation: boolean | null;
  emailEnabled: boolean | null;
  emailSystem: boolean | null;
  emailAgency: boolean | null;
  emailDonation: boolean | null;
  emailDigestMode: string | null;
  quietHoursEnabled: boolean | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  updatedAt: string | null;
}

/**
 * 通知偏好：站內開關影響小鈴鐺；寄信由資料庫排程，再交給 dispatch-member-mail。
 */
@Injectable({
  providedIn: 'root',
})
export class MemberNotificationSettingsService {
  private readonly tableName = 'member_notification_settings';

  private readonly supabaseService = inject(SupabaseService);
  private readonly session = inject(MemberSessionService);

  private readonly settingsSignal = signal<MemberNotificationSettings | null>(null);
  readonly settings = this.settingsSignal.asReadonly();

  async loadSettings(): Promise<MemberNotificationSettings> {
    const uid = await this.session.getCurrentUid();

    const { data, error } = await this.supabaseService.client.from(this.tableName).select('*').eq('uid', uid).maybeSingle();

    if (error) {
      console.error('讀取通知設定失敗：', error);
      throw error;
    }

    const settings = data ? this.mapRow(data as NotificationSettingsRow) : await this.createDefault(uid);
    this.settingsSignal.set(settings);

    return settings;
  }

  async saveSettings(update: NotificationSettingsUpdate): Promise<MemberNotificationSettings> {
    const uid = await this.session.getCurrentUid();
    const row = this.toRow(uid, update);

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .upsert(row, { onConflict: 'uid' })
      .select('*')
      .single();

    if (error) {
      console.error('儲存通知設定失敗：', error);
      throw error;
    }

    const settings = this.mapRow(data as NotificationSettingsRow);
    this.settingsSignal.set(settings);

    return settings;
  }

  private async createDefault(uid: string): Promise<MemberNotificationSettings> {
    const defaults = defaultNotificationSettings(uid);
    const row = this.toRow(uid, defaults);

    const { data, error } = await this.supabaseService.client.from(this.tableName).insert(row).select('*').single();

    if (error) {
      // 併發建立時改讀既有列
      const { data: existing, error: readError } = await this.supabaseService.client
        .from(this.tableName)
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (readError || !existing) {
        console.error('建立通知設定失敗：', error);
        throw error;
      }

      return this.mapRow(existing as NotificationSettingsRow);
    }

    return this.mapRow(data as NotificationSettingsRow);
  }

  private toRow(uid: string, source: NotificationSettingsUpdate | MemberNotificationSettings) {
    return {
      uid,
      inAppSystem: source.inApp.system,
      inAppAgency: source.inApp.agency,
      inAppDonation: source.inApp.donation,
      emailEnabled: source.emailEnabled,
      emailSystem: source.email.system,
      emailAgency: source.email.agency,
      emailDonation: source.email.donation,
      emailDigestMode: source.emailDigestMode,
      quietHoursEnabled: source.quietHoursEnabled,
      quietHoursStart: source.quietHoursStart,
      quietHoursEnd: source.quietHoursEnd,
      updatedAt: new Date().toISOString(),
    };
  }

  private mapRow(row: NotificationSettingsRow): MemberNotificationSettings {
    const mode = (row.emailDigestMode ?? 'DAILY') as EmailDigestMode;
    const validMode: EmailDigestMode = ['INSTANT', 'DAILY', 'WEEKLY', 'OFF'].includes(mode) ? mode : 'DAILY';

    const inApp: ChannelToggles = {
      system: row.inAppSystem ?? true,
      agency: row.inAppAgency ?? true,
      donation: row.inAppDonation ?? true,
    };

    const email: ChannelToggles = {
      system: row.emailSystem ?? false,
      agency: row.emailAgency ?? true,
      donation: row.emailDonation ?? true,
    };

    return {
      uid: row.uid,
      inApp,
      emailEnabled: row.emailEnabled ?? false,
      email,
      emailDigestMode: validMode,
      quietHoursEnabled: row.quietHoursEnabled ?? true,
      quietHoursStart: (row.quietHoursStart ?? '22:00').slice(0, 5),
      quietHoursEnd: (row.quietHoursEnd ?? '08:00').slice(0, 5),
      updatedAt: row.updatedAt ?? new Date().toISOString(),
    };
  }
}
