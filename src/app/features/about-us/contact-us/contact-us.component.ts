import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SUPPORT_CATEGORIES, SUPPORT_EMAIL } from '../../../core/content/support-contact';
import { SupportComplaintService } from '../../../core/services/admin/support-complaint.service';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
})
export class ContactUsComponent {
  private readonly complaints = inject(SupportComplaintService);
  private readonly auth = inject(AuthSessionService);

  protected readonly supportEmail = SUPPORT_EMAIL;
  protected readonly categories = SUPPORT_CATEGORIES;
  protected readonly sending = signal(false);
  protected readonly notice = signal('');
  protected readonly sent = signal(false);

  protected name = '';
  protected email = '';
  protected category = '';
  protected message = '';
  protected consent = false;

  protected async submit(): Promise<void> {
    if (this.sending()) {
      return;
    }

    if (!this.name.trim() || !this.email.trim() || !this.category || !this.message.trim() || !this.consent) {
      this.sent.set(false);
      this.notice.set('請填完姓名、信箱、問題類型與內容，並勾選同意聯繫。');
      return;
    }

    this.sending.set(true);
    try {
      const result = await this.complaints.submit({
        senderName: this.name,
        senderEmail: this.email,
        senderUid: this.auth.principal().userId,
        category: this.category,
        body: this.message,
      });
      this.sent.set(result.mailed);
      this.notice.set(result.mailed ? '已記在管理者的客訴列表，並同步寄一份到客服信箱。' : result.mailNotice);
      this.name = '';
      this.email = '';
      this.category = '';
      this.message = '';
      this.consent = false;
    } catch (error) {
      console.error(error);
      this.sent.set(false);
      this.notice.set(error instanceof Error && error.message ? error.message : '訊息沒有送出，請稍後再試，或直接寄信到客服信箱。');
    } finally {
      this.sending.set(false);
    }
  }
}
