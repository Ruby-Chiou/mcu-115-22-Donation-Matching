import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MemberMessageService } from '../../../core/services/member-center/member-message.service';
import { MESSAGE_CATEGORY_LABELS, MemberMessage, MessageCategory, MessageFolder } from '../../../models/member/member-message';

type InboxFilter = 'ALL' | 'UNREAD' | 'STARRED' | MessageCategory;

@Component({
  selector: 'app-member-inbox',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './member-inbox.component.html',
  styleUrl: './member-inbox.component.scss',
})
export class MemberInboxComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly messageService = inject(MemberMessageService);

  readonly categoryLabels = MESSAGE_CATEGORY_LABELS;
  readonly filterOptions: { value: InboxFilter; label: string }[] = [
    { value: 'ALL', label: '全部' },
    { value: 'UNREAD', label: '未讀' },
    { value: 'STARRED', label: '已加星號' },
    { value: 'SYSTEM', label: MESSAGE_CATEGORY_LABELS.SYSTEM },
    { value: 'AGENCY', label: MESSAGE_CATEGORY_LABELS.AGENCY },
    { value: 'DONATION', label: MESSAGE_CATEGORY_LABELS.DONATION },
  ];

  readonly isLoading = signal(true);
  readonly errorText = signal('');
  readonly folder = signal<MessageFolder>('inbox');
  readonly activeFilter = signal<InboxFilter>('ALL');
  readonly keyword = signal('');
  readonly selectedId = signal<number | null>(null);
  readonly isComposing = signal(false);
  readonly isSending = signal(false);
  readonly replyParentId = signal<number | null>(null);

  readonly composeForm = this.fb.nonNullable.group({
    recipientUid: ['', [Validators.required]],
    subject: ['', [Validators.required, Validators.maxLength(100)]],
    content: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  readonly filteredMessages = computed(() => {
    const isInbox = this.folder() === 'inbox';
    const source = isInbox ? this.messageService.inbox() : this.messageService.sent();
    const filter = this.activeFilter();
    const keyword = this.keyword().trim().toLowerCase();

    return source.filter((message) => {
      if (isInbox && filter === 'UNREAD' && message.isRead) return false;
      if (isInbox && filter === 'STARRED' && !message.isStarred) return false;
      if (isInbox && filter !== 'ALL' && filter !== 'UNREAD' && filter !== 'STARRED' && message.category !== filter) return false;

      if (!keyword) return true;

      const counterpart = isInbox ? message.senderName : message.recipientName;

      return [message.subject, message.content, counterpart].some((text) => text.toLowerCase().includes(keyword));
    });
  });

  readonly selectedMessage = computed(() => {
    const id = this.selectedId();
    const source = this.folder() === 'inbox' ? this.messageService.inbox() : this.messageService.sent();

    return source.find((message) => message.id === id) ?? null;
  });

  async ngOnInit(): Promise<void> {
    try {
      await this.messageService.loadAll();
    } catch {
      this.errorText.set('無法載入信件，請稍後再試。');
    } finally {
      this.isLoading.set(false);
    }
  }

  switchFolder(folder: MessageFolder): void {
    this.folder.set(folder);
    this.activeFilter.set('ALL');
    this.selectedId.set(null);
    this.isComposing.set(false);
  }

  setFilter(filter: InboxFilter): void {
    this.activeFilter.set(filter);
    this.selectedId.set(null);
  }

  onKeywordInput(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
  }

  async openMessage(message: MemberMessage): Promise<void> {
    this.isComposing.set(false);
    this.selectedId.set(message.id);

    if (this.folder() === 'inbox') {
      await this.runSafely(() => this.messageService.markAsRead(message));
    }
  }

  async toggleStar(message: MemberMessage, event?: Event): Promise<void> {
    event?.stopPropagation();
    await this.runSafely(() => this.messageService.toggleStar(message));
  }

  async deleteMessage(message: MemberMessage): Promise<void> {
    if (!window.confirm(`確定要刪除「${message.subject}」嗎？`)) {
      return;
    }

    await this.runSafely(() => this.messageService.deleteMessage(message, this.folder()));
    this.selectedId.set(null);
  }

  startCompose(): void {
    this.replyParentId.set(null);
    this.composeForm.reset();
    this.selectedId.set(null);
    this.isComposing.set(true);
  }

  startReply(message: MemberMessage): void {
    if (!message.senderUid) {
      return;
    }

    this.replyParentId.set(message.id);
    this.composeForm.reset({
      recipientUid: message.senderUid,
      subject: message.subject.startsWith('Re: ') ? message.subject : `Re: ${message.subject}`,
      content: '',
    });
    this.isComposing.set(true);
  }

  cancelCompose(): void {
    this.isComposing.set(false);
  }

  async sendMessage(): Promise<void> {
    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      return;
    }

    const { recipientUid, subject, content } = this.composeForm.getRawValue();
    const contact = this.messageService.contacts().find((item) => item.uid === recipientUid);

    this.isSending.set(true);

    try {
      await this.messageService.sendMessage({
        recipientUid,
        recipientName: contact?.name ?? '',
        subject,
        content,
        parentId: this.replyParentId(),
      });
      this.isComposing.set(false);
      this.errorText.set('');
      window.alert('信件已寄出');
    } catch {
      this.errorText.set('寄送失敗，請稍後再試。');
    } finally {
      this.isSending.set(false);
    }
  }

  canReply(message: MemberMessage): boolean {
    return this.folder() === 'inbox' && message.category === 'AGENCY' && !!message.senderUid;
  }

  hasComposeError(controlName: 'recipientUid' | 'subject' | 'content'): boolean {
    const control = this.composeForm.controls[controlName];

    return control.touched && control.invalid;
  }

  private async runSafely(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch {
      this.errorText.set('操作失敗，請稍後再試。');
    }
  }
}
