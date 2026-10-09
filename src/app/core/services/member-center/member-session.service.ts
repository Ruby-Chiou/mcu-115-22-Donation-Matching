import { Injectable, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';

import { SupabaseService } from '../database/supabase.service';

/** 尚未串接登入前，未登入時一律視為此測試帳號 */
export const DEV_DONOR_UID = 'dev-donor-001';

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

  async getCurrentUid(): Promise<string> {
    const user = await this.getAuthUser();

    return user?.id ?? DEV_DONOR_UID;
  }
}
