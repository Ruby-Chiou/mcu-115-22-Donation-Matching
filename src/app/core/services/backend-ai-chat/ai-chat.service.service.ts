import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
  private readonly apiUrl = environment.aiChatApiUrl;

  /** 附上平台摘要，避免後端提示詞漏掉志工／協力者等相關問答。 */
  chat(message: string, role: string, history: ChatHistoryItem[], system = AI_ASSISTANT_BRIEF): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(
      this.apiUrl,
      {
        message,
        role,
        history,
        system,
      },
      {
        headers: {
          apikey: environment.supabasePublishableKey,
          Authorization: `Bearer ${environment.supabasePublishableKey}`,
        },
      },
    );
  }
}
