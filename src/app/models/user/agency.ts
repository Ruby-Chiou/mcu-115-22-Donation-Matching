import { UserBase } from './user-base';

export interface AgencyProfile extends UserBase {
  role: 'AGENCY';
  agencyName: string;
  registrationNumber: string;
  isVerified: 'PENDING' | 'APPROVED' | 'REJECTED';
  representative: string;
  contactPhone: string;
  defaultAddress: string;
}

/** 目前登入受助機構的固定資料。收據不再讓使用者手打這三欄。 */
export const AGENCY_OFFICE = {
  agencyName: '示範社福機構',
  agencyPhone: '02-2500-1000',
  officeAddress: '台北市中山區示範路88號',
} as const;
