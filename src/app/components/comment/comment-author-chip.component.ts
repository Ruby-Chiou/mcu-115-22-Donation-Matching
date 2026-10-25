import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CommentAuthorRole } from './comment-author.data';
import { AuthorCard, CommentAuthorCardService } from './comment-author-card.service';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import { BeneficiaryPublicProfileService } from '../../core/services/agency/beneficiary-public-profile.service';
import { MemberMessageService } from '../../core/services/member-center/member-message.service';

@Component({
  selector: 'app-comment-author',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './comment-author-chip.component.html',
  styleUrl: './comment-author-chip.component.scss',
})
export class CommentAuthorChipComponent {
  private readonly auth = inject(AuthSessionService);
  private readonly messages = inject(MemberMessageService);
  private readonly router = inject(Router);
  private readonly cards = inject(CommentAuthorCardService);
  private readonly agencies = inject(BeneficiaryPublicProfileService);

  @Input({ required: true }) name = '';
  @Input() userId: string | null = null;
  @Input() role: CommentAuthorRole = 'donor';

  readonly open = signal(false);
  readonly card = signal<AuthorCard | null>(null);
  readonly cardLoading = signal(false);
  readonly composing = signal(false);
  readonly sending = signal(false);
  readonly notice = signal('');
  readonly noticeIsError = signal(false);

  subject = '留言區私訊';
  content = '';

  get initial(): string {
    return [...this.name.trim()][0] ?? '?';
  }

  get kindAttr(): string {
    const loaded = this.card();
    return loaded?.type === 'donor' ? loaded.donorKind : this.role;
  }

  get roleLabel(): string {
    const loaded = this.card();

    if (loaded?.type === 'donor') {
      return loaded.donorKind === 'company' ? '企業捐助者' : '個人捐助者';
    }

    return this.role === 'agency' ? '受助者' : '捐助者';
  }

  agencyFields() {
    const loaded = this.card();
    return loaded?.type === 'agency' ? this.agencies.fields(loaded.profile) : [];
  }

  thankDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}/${month}/${day}`;
  }

  get isSelf(): boolean {
    const mine = this.auth.principal().userId;
    return !!mine && mine === this.userId;
  }

  get isGuest(): boolean {
    return this.auth.principal().role === 'guest';
  }

  toggle(event: Event): void {
    event.stopPropagation();
    const next = !this.open();
    this.open.set(next);
    this.composing.set(false);
    this.notice.set('');

    if (next && this.userId) {
      void this.loadCard();
    }
  }

  private async loadCard(): Promise<void> {
    if (!this.userId) {
      return;
    }

    this.cardLoading.set(true);

    try {
      this.card.set(await this.cards.load(this.userId, this.role, this.name));
    } finally {
      this.cardLoading.set(false);
    }
  }

  close(): void {
    this.open.set(false);
    this.composing.set(false);
  }

  openPublicProfile(): void {
    const loaded = this.card();

    if (loaded?.type !== 'agency') {
      return;
    }

    const name = loaded.profile.organizationName.trim();

    if (!name) {
      return;
    }

    void this.router.navigate(['/donor/beneficiaries', name], {
      state: { beneficiaryProfile: loaded.profile },
    });
  }

  startMessage(): void {
    if (this.isGuest) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.composing.set(true);
    this.notice.set('');
  }

  async send(): Promise<void> {
    const text = this.content.trim();
    if (!this.userId || !text || this.sending()) {
      return;
    }

    this.sending.set(true);
    this.notice.set('');

    try {
      await this.messages.sendMessage({
        recipientUid: this.userId,
        recipientName: this.name,
        subject: this.subject.trim() || '留言區私訊',
        content: text,
      });
      this.content = '';
      this.composing.set(false);
      this.noticeIsError.set(false);
      this.notice.set('已送到對方的站內信箱。你可以在會員專區的收件匣看寄件備份。');
    } catch (error) {
      this.noticeIsError.set(true);
      this.notice.set(error instanceof Error ? error.message : '私訊沒有送出，請稍後再試。');
    } finally {
      this.sending.set(false);
    }
  }
}
