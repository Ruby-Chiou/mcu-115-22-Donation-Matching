import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AiChatRequest{
  message:string;
  role:string;
}

export interface AiChatResponse {
  answer:string;
}

@Injectable({
  providedIn: 'root',
})
export class AiChatService {
  private readonly http=inject(HttpClient);
  private readonly apiUrl = 'https://localhost:7020/api/assistant/chat';
  
  chat(message: string, role: string): Observable<AiChatResponse> {
    const body: AiChatRequest = {
      message: message,
      role: role
    };

    return this.http.post<AiChatResponse>(this.apiUrl, body);
  }
}
