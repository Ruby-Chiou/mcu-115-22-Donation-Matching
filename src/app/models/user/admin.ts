import { UserBase } from './user-base';

export interface AdminProfile extends UserBase {
  role: 'ADMIN';
  adminLevel: 'SUPER' | 'REVIEWER'; // 權限分級
}
