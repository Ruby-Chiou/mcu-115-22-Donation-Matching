import { Injectable, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';

import { environment } from '../../../../environment/environment';
import { SupabaseService } from '../database/supabase.service';

/**
 * 會員身分解析：優先 Supabase Auth；開發期可退回 environment.memberDemoUid。
 * 其他會員服務只依賴本服務取得 uid，不各自硬編碼測試帳號。
 */
@Injectable({
  providedIn: 'root',
})
export class MemberSessionService {
  private readonly supabaseService = inject(SupabaseService);

  async getAuthUser(): Promise<User | null> {
    const { data, error } = await this.supabaseService.client.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user;
  }

  /**
   * @throws 當未登入且未設定 memberDemoUid（正式環境應開啟此情況）
   */
  async getCurrentUid(): Promise<string> {
    const user = await this.getAuthUser();

    if (user?.id) {
      return user.id;
    }

    if (environment.memberDemoUid) {
      return environment.memberDemoUid;
    }

    throw new Error('尚未登入，無法使用會員專區');
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getAuthUser()) !== null;
  }
}
