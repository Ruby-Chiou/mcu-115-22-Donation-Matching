import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../../core/services/backend-ai-chat/ai-chat.service.service';
import { APP_ROLE_LABEL } from '../../../models/auth/app-role';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';

interface ChatMessage {
  sender: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent implements OnInit {
  private readonly assistantApi = inject(AiChatService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthSessionService);
  @ViewChild('messagePane') private messagePane?: ElementRef<HTMLElement>;

  async ngOnInit(): Promise<void> {
    await this.auth.restore();
    this.currentRole = APP_ROLE_LABEL[this.auth.principal().role];
    this.cdr.markForCheck();
  }

  message = '';
  currentRole = '訪客';
  isLoading = false;
  errorMessage = '';

  messages: ChatMessage[] = [];

  private extractAssistantReply(response: unknown): string {
    if (typeof response === 'string') {
      return response.trim();
    }

    if (!response || typeof response !== 'object') {
      return '';
    }

    const record = response as Record<string, unknown>;

    for (const key of ['answer', 'message', 'reply', 'content', 'result']) {
      const value = record[key];

      if (typeof value === 'string') {
        const text = value.trim();

        if (text) {
          return text;
        }
      }

      if (value && typeof value === 'object') {
        const nested = this.extractAssistantReply(value);

        if (nested) {
          return nested;
        }
      }
    }

    if (record['data'] && typeof record['data'] === 'object') {
      return this.extractAssistantReply(record['data']);
    }

    return '';
  }

  sendMessage(): void {
    const text = this.message.trim();

    if (!text || this.isLoading) {
      return;
    }

    const history = this.messages.slice(-6);

    this.messages = [
      ...this.messages,
      {
        sender: 'user',
        content: text,
      },
    ];

    this.message = '';
    this.errorMessage = '';
    this.isLoading = true;

    this.cdr.detectChanges();
    this.scrollToLatest();

    this.assistantApi.chat(text, this.currentRole, history).subscribe({
      next: (response) => {
        const answer = this.extractAssistantReply(response);

        this.messages = [
          ...this.messages,
          {
            sender: 'assistant',
            content: answer || '抱歉，目前沒有取得有效回覆。',
          },
        ];

        this.isLoading = false;
        this.cdr.detectChanges();
        this.scrollToLatest();
      },

      error: () => {
        this.errorMessage = '目前無法連線至 AI 客服，請稍後再試。';

        this.messages = [
          ...this.messages,
          {
            sender: 'assistant',
            content: '抱歉，AI 客服目前暫時無法使用，請稍後再試。',
          },
        ];

        this.isLoading = false;
        this.cdr.detectChanges();
        this.scrollToLatest();
      },
    });
  }

  private scrollToLatest(): void {
    queueMicrotask(() => {
      const pane = this.messagePane?.nativeElement;

      if (pane) {
        pane.scrollTop = pane.scrollHeight;
      }
    });
  }

  onKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }
}
