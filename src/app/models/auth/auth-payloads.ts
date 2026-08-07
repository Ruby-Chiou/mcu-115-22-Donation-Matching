export type UserRole = 'donor' | 'recipient';

export interface LoginPayload {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterDonorPayload {
  email: string;
  accountName?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  // 第三方登入會回傳 provider 與 token
  provider?: 'google' | 'line' | 'facebook';
  providerToken?: string;
}

export interface RegisterAgencyPayload {
  email: string;
  password?: string;
  agencyName: string;
  registrationNumber?: string;
  representative?: string;
  contactPhone?: string;
  contactEmail?: string;
  defaultAddress?: string;
  // 聯絡人（自然人）資訊，用於後續驗證（選填）
  contactPersonName?: string;
  contactPersonNationalId?: string; // 若要收，注意安全/加密
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  // 上傳驗證文件的檔案 key / URL（前端通常先上傳到 storage，再把 ref 傳後端）
  verificationDocumentUrl?: string;
  consentToContact?: boolean;
}
