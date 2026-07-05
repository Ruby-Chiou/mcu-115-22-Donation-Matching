export type UserRole = 'DONOR' | 'AGENCY' | 'ADMIN';

export interface UserBase {
  uid: string; // 唯一使用者ID (未來串Google登入時的唯一碼)
  email: string; // 登入帳號
  role: UserRole; // 角色權限
  createdAt: Date; // 註冊時間
}
