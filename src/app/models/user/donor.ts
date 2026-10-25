import { UserBase } from './user-base';

/** 登入來源；第三方登入接上後由 Auth provider 寫入 */
export type DonorLoginProvider = 'email' | 'google' | 'line' | 'facebook';

export type DonorAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export const DONOR_LOGIN_PROVIDER_LABELS: Record<DonorLoginProvider, string> = {
  email: 'Email 帳號',
  google: 'Google',
  line: 'LINE',
  facebook: 'Facebook',
};

export interface DonorProfile extends UserBase {
  role: 'DONOR';
  displayName: string; // 公開顯示名稱／暱稱
  accountName?: string; // 帳號名稱（註冊時設定）
  fullName?: string; // 真實姓名（收據抬頭等）
  phoneNumber?: string;
  city?: string; // 所在縣市（物流／面交參考）
  avatarUrl?: string;
  loginProvider: DonorLoginProvider;
  accountStatus: DonorAccountStatus;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
