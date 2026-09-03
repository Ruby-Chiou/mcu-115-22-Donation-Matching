import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../../core/services/ai-chat.service.service';

interface ChatMessage {
  sender: 'user' | 'assistant';
  content: string;
}

interface FaqItem {
  id: number;
  type: 'donor' | 'recipient';
  question: string;
  answer: string[];
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
      const nested = this.extractAssistantReply(record['data']);
      if (nested) {
        return nested;
      }
    }

    return '';
  }

  sendMessage(): void {
    const text = this.message.trim();

    if (!text || this.isLoading) {
      return;
    }

    console.log('準備送出訊息：', text);

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

    this.assistantApi.chat(text, this.currentRole).subscribe({
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
        console.log('messages 陣列：', this.messages);
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

  //FAQ常見問題
  expandedFaqId: number | null = null;

  toggleFaq(faqId: number): void {
    this.expandedFaqId = this.expandedFaqId === faqId ? null : faqId;
  }

  donorFaqs: FaqItem[] = [
    {
      id: 1,
      type: 'donor',
      question: '如何進行捐助？',
      answer: [
        ' 瀏覽平台上的捐助需求或公益專案。',
        ' 選擇想支持的項目，進入詳細內容頁面。',
        ' 點選「立即捐助」或「我要捐助」。',
        ' 選擇資金或物資捐助，並填寫必要資料。',
        ' 確認內容後完成付款或物資交付。',
        ' 可至「我的捐助紀錄」查看捐助狀態。',
      ],
    },
    {
      id: 2,
      type: 'donor',
      question: '有哪些捐款方式？',
      answer: ['可用付款方式會顯示在捐助頁面。', '請依頁面提供的選項選擇適合的付款方式。', '完成付款後，請保留交易成功畫面或付款證明。'],
    },
    {
      id: 3,
      type: 'donor',
      question: '捐款後會收到收據嗎？',
      answer: [
        '完成捐助後，可至「我的捐助紀錄」查看收據狀態。',
        '若平台或受贈單位提供電子收據，會依系統通知方式寄送或供下載。',
        '如未收到收據，請確認 Email 垃圾郵件匣，或聯絡客服查詢。',
      ],
    },
    {
      id: 4,
      type: 'donor',
      question: '如何查詢我的捐款紀錄？',
      answer: [
        '登入您的平台帳號。',
        '前往「我的帳戶」或「會員中心」。',
        '點選「我的捐助紀錄」或「捐款紀錄」。',
        '即可查看捐助日期、專案、金額與目前狀態。',
      ],
    },
    {
      id: 5,
      type: 'donor',
      question: '捐款收據可以用來抵稅嗎？',
      answer: [
        '是否可抵稅，須視受贈單位是否符合相關稅法資格而定。',
        '請妥善保留正式捐贈收據。',
        '報稅時請依當年度規定，以列舉扣除額方式申報。',
        '如有稅務疑問，建議向國稅局或專業人士確認。',
      ],
    },
  ];

  recipientFaqs: FaqItem[] = [
    {
      id: 6,
      type: 'recipient',
      question: '如何申請受助？',
      answer: [
        ' 登入平台；尚未有帳號者請先完成註冊。',
        ' 前往「申請受助」或「物資申請」頁面。',
        ' 選擇需要申請的資源類型。',
        ' 填寫基本資料、需求原因與聯絡方式。',
        ' 上傳所需證明文件並送出申請。',
        ' 至「我的申請」查看後續進度與通知。',
      ],
    },
    {
      id: 7,
      type: 'recipient',
      question: '申請受助需要什麼條件？',
      answer: [
        '申請資格會依資源類型與合作單位規定而不同。',
        '通常需要提供基本資料、需求說明與相關證明文件。',
        '請先閱讀申請頁面的適用對象與限制。',
        '文件請保持清楚、有效，並依通知補齊資料。',
      ],
    },
    {
      id: 8,
      type: 'recipient',
      question: '申請審核需要多久時間？',
      answer: [
        '實際審核時間會依案件數量、資料完整度與資源類型而不同。',
        '資料完整後，平台或審核單位會進行資格與需求確認。',
        '如需要補件，審核會在補齊資料後繼續進行。',
        '請定期查看「我的申請」及 Email、簡訊通知。',
      ],
    },
  ];
}
