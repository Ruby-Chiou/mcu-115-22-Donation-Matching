import { UserBase } from './user-base';

export interface DonorProfile extends UserBase {
  role: 'DONOR';
  displayName: string; // 顯示名稱/暱稱
  phoneNumber?: string; // 聯絡電話 (日常可不填，救災要面交再填)
}
