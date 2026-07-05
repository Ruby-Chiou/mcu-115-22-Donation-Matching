import { UserBase } from './user-base';

export interface AgencyProfile extends UserBase {
  role: 'AGENCY';
  agencyName: string; // 機構全銜
  registrationNumber: string; // 衛福部註冊字號
  isVerified: 'PENDING' | 'APPROVED' | 'REJECTED'; // 審核狀態
  representative: string; // 機構負責人姓名
  contactPhone: string; // 機構辦公室電話
  defaultAddress: string; // 機構日常預設收件地址
}
