import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
  private readonly apiUrl = 'https://mcu-115-22-donation-matching-backend.onrender.com/api/assistant/chat';

  chat(message: string, role: string, history: ChatHistoryItem[]): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(this.apiUrl, {
      message,
      role,
      history,
    });
  }
}
