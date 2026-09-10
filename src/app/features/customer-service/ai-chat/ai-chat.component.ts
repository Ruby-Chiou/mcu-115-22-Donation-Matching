import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../../core/services/ai-chat.service.service';

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
export class AiChatComponent {
  private readonly assistantApi = inject(AiChatService);
  private readonly cdr = inject(ChangeDetectorRef);

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

    console.log('準備送出訊息：', text);

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

    this.assistantApi.chat(text, this.currentRole, history).subscribe({
      next: (response) => {
        console.log('收到後端回覆：', response);

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

        console.log('已停止 loading：', this.isLoading);
      },

      error: (error) => {
        console.error('AI 客服 API 呼叫失敗：', error);

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

        console.log('錯誤後已停止 loading：', this.isLoading);
      },
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
