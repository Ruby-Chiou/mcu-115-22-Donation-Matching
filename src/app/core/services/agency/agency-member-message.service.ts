import { Injectable, inject } from '@angular/core';

import { AuthSessionService } from '../auth/auth-session.service';
import { SupabaseService } from '../database/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AgencyMemberMessageService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthSessionService);

  async sendToDonor(donorUid: string, donorName: string, subject: string, content: string): Promise<void> {
    const message = content.trim();

    if (!donorUid) {
      throw new Error('這筆沒有會員帳號，無法用站內信聯絡');
    }

    if (message.length < 2) {
      throw new Error('請先寫下要聯絡的內容');
    }

    const senderUid = this.auth.principal().userId;
    if (!senderUid) {
      throw new Error('請先登入受助機構帳號');
    }

    const { error } = await this.supabase.client.from('member_messages').insert({
      recipientUid: donorUid,
      recipientName: donorName || '捐助者',
      senderUid,
      senderName: this.auth.principal().displayName || '受助機構',
      category: 'AGENCY',
      subject,
      content: message,
    });

    if (error) {
      throw new Error('站內信沒有送出，請稍後再試。');
    }
  }
}
