import { Injectable, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';

import { environment } from '../../../../environment/environment';
import { SupabaseService } from '../database/supabase.service';

/**
 * 會員 uid 以 Supabase Auth 為準。
 * memberDemoUid 僅在明確設定時作為後備，預設關閉。
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
