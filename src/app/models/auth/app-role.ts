/** 應用程式身分別。訪客沒有帳號；其餘三種只會由資料庫寫入，前端不能自選。 */
export const APP_ROLES = ['guest', 'donor', 'agency', 'admin'] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** 登入／註冊畫面可點的入口。管理者不能從註冊流程建立。 */
export type LoginPortal = Exclude<AppRole, 'guest'>;

export const APP_ROLE_LABEL: Record<AppRole, string> = {
  guest: '訪客',
  donor: '捐助者',
  agency: '受助者',
  admin: '管理者',
};

export type DonorKind = 'individual' | 'company';

export type CompanyReviewStatus = 'pending' | 'approved' | 'rejected' | 'supplement';

export interface AuthPrincipal {
  role: AppRole;
  userId: string | null;
  email: string;
  displayName: string;
  donorKind: DonorKind | null;
  companyStatus: CompanyReviewStatus | null;
  companyReviewNote: string;
}

export const GUEST_PRINCIPAL: AuthPrincipal = {
  role: 'guest',
  userId: null,
  email: '',
  displayName: '',
  donorKind: null,
  companyStatus: null,
  companyReviewNote: '',
};

export function isLoginPortal(value: string): value is LoginPortal {
  return value === 'donor' || value === 'agency' || value === 'admin';
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}
