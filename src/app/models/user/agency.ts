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
