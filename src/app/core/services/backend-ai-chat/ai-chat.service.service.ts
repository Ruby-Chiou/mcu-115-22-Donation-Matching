import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  /** system 預設空白，改由後端 OpenRouterService 內建提示詞負責。 */
  chat(message: string, role: string, history: ChatHistoryItem[], system = ''): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(this.apiUrl, {
      message,
      role,
      history,
      system,
    });
  }
}
