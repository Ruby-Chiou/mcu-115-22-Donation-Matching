import { UserBase } from './user-base';

/** 受助者註冊與會員專區的完整主檔，對應 public.agency_profiles。 */
export interface AgencyProfile extends UserBase {
  role: 'AGENCY';
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
  verificationStatus: 'pending' | 'approved' | 'rejected';
  consentToContact: boolean;
  agreeToTerms: boolean;
  city: string;
  image: string;
  introImages: string[];
  establishedYear: string;
  registrationLabel: string;
  serviceArea: string;
  serviceTargets: string[];
  mission: string;
  background: string;
  websiteUrl: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt?: Date;
}

/** 目前登入受助機構的固定資料。收據不再讓使用者手打這三欄。 */
export const AGENCY_OFFICE = {
  agencyName: '示範社福機構',
  agencyPhone: '02-2500-1000',
  officeAddress: '台北市中山區示範路88號',
} as const;
