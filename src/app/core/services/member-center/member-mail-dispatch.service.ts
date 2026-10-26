import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../database/supabase.service';

/** 請已登入的使用者觸發到期通知信。沒有到期的信時不會寄出。 */
@Injectable({
  providedIn: 'root',
})
export class MemberMailDispatchService {
  private readonly supabase = inject(SupabaseService);
  private sweeping: Promise<void> | null = null;

  sweep(): Promise<void> {
    this.sweeping ??= this.invoke().finally(() => {
      this.sweeping = null;
    });

    return this.sweeping;
  }

  private async invoke(): Promise<void> {
    const { error } = await this.supabase.client.functions.invoke('dispatch-member-mail', { body: {} });

    if (error) {
      console.error('通知信沒有寄出：', error);
    }
  }
}
