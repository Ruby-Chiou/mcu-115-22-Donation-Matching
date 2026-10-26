/** 電子郵件彙整頻率。寄出時間由資料庫排程，再由 dispatch-member-mail 寄出。 */
export type EmailDigestMode = 'INSTANT' | 'DAILY' | 'WEEKLY' | 'OFF';

export const EMAIL_DIGEST_MODE_LABELS: Record<EmailDigestMode, string> = {
  INSTANT: '即時寄送',
  DAILY: '每日彙整一次',
  WEEKLY: '每週彙整一次',
  OFF: '不寄信（僅站內）',
};

export interface ChannelToggles {
  system: boolean;
  agency: boolean;
  donation: boolean;
}

export interface MemberNotificationSettings {
  uid: string;
  /** 站內通知（收件匣／小鈴鐺） */
  inApp: ChannelToggles;
  /** 是否啟用私人信箱通知 */
  emailEnabled: boolean;
  /** 各類別是否寄到私人信箱（需 emailEnabled） */
  email: ChannelToggles;
  /** 寄信頻率 */
  emailDigestMode: EmailDigestMode;
  /** 勿擾時段：此時段內不寄即時信，改併入下次彙整 */
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string;
  updatedAt: string;
}

export interface NotificationSettingsUpdate {
  inApp: ChannelToggles;
  emailEnabled: boolean;
  email: ChannelToggles;
  emailDigestMode: EmailDigestMode;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export function defaultNotificationSettings(uid: string): MemberNotificationSettings {
  return {
    uid,
    inApp: { system: true, agency: true, donation: true },
    emailEnabled: false,
    email: { system: false, agency: true, donation: true },
    emailDigestMode: 'DAILY',
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    updatedAt: new Date().toISOString(),
  };
}

/** 關閉的類別不計入小鈴鐺。收件匣裡的舊信仍看得到。 */
export function alertsInApp(category: 'SYSTEM' | 'AGENCY' | 'DONATION', inApp: ChannelToggles | null): boolean {
  if (!inApp) {
    return true;
  }

  if (category === 'SYSTEM') {
    return inApp.system;
  }

  if (category === 'AGENCY') {
    return inApp.agency;
  }

  return inApp.donation;
}
