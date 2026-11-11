import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AI_ASSISTANT_BRIEF } from '../../content/ai-assistant-brief';
import { environment } from '../../../../environment/environment';

export interface ChatHistoryItem {
  sender: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  answer?: string;
  message?: string;
  reply?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiChatService {
  private readonly http = inject(HttpClient);

  /** 正式環境走 Supabase Edge；本機填了 backendApiUrl 才打 C#。 */
  private get apiUrl(): string {
    const backend = environment.backendApiUrl?.replace(/\/$/, '');
    if (backend) {
      return `${backend}/api/Assistant/chat`;
    }
    return environment.aiChatApiUrl;
  }

  /**
   * 判斷是否符合固定回答的關鍵字。
   * 符合時回傳固定答案，不符合時回傳 null。
   */
  private getFixedAnswer(message: string): string | null {
    // 1. 忘記密碼
    if (message.includes('帳號') && message.includes('忘記密碼')) {
      return '請在登入頁面點選「忘記密碼」，系統會寄重設連結到註冊信箱。若未收到，請先檢查垃圾郵件，或到「聯絡我們」留下信箱。';
    }

    // 2. 金錢捐助
    if (['捐錢', '捐款', '現金', '金錢', '匯款', '轉帳'].some((keyword) => message.includes(keyword))) {
      return '本平台只媒合實體物資，不接受金錢、匯款、轉帳或刷卡。你可以到「日常捐助」或開啟中的「災害救助」查看需求後送出捐助。';
    }

    // 3. 如何捐助
    if (['我要捐', '我想捐', '想捐助', '如何捐', '怎麼捐'].some((keyword) => message.includes(keyword))) {
      return '請先登入捐助者帳號，進入「日常捐助」或「災害救助」選需求，填寫實際物資與交付方式後送出。通過審核後再依寄送或面交自行交付。';
    }

    // 4. 申請物資
    if (message.includes('申請物資') || (message.includes('物資') && message.includes('申請'))) {
      return '請先以受助者身分登入，在後台刊登需求並填寫數量與聯絡方式。捐助者送出申請後，你可在審核頁接受或不接受。';
    }

    // 沒有符合任何固定回答
    return null;
  }

  /** 附上平台摘要，避免提示詞漏掉志工／協力者等相關問答。 */

  chat(message: string, role: string, history: ChatHistoryItem[], system = AI_ASSISTANT_BRIEF): Observable<AiChatResponse> {
    // 先檢查是否符合固定回答
    const fixedAnswer = this.getFixedAnswer(message);

    if (fixedAnswer !== null) {
      return of({ answer: fixedAnswer });
    }

    // 以下維持原本的 API 呼叫流程
    const backend = environment.backendApiUrl?.replace(/\/$/, '');

    const headers: Record<string, string> = backend
      ? { 'Content-Type': 'application/json' }
      : {
          apikey: environment.supabasePublishableKey,
          Authorization: `Bearer ${environment.supabasePublishableKey}`,
        };

    return this.http.post<AiChatResponse>(
      this.apiUrl,
      {
        message,
        role,
        history,
        system,
      },
      { headers }
    );
  }
}
