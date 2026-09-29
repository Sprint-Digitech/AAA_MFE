import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentChatRequest {
  message: string;
  history?: ChatHistoryMessage[];
  branchId?: string;
}

export interface AgentChatResponse {
  success: boolean;
  humanResponse: string;
  intent: string;
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
  data?: any;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AiAgentService {
  private readonly baseUrl = 'https://test.fovestta.com/auth/sdapi/api/HRMSAgent';

  constructor(private http: HttpClient) {}

  chat(request: AgentChatRequest): Observable<AgentChatResponse> {
    const token = sessionStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<AgentChatResponse>(`${this.baseUrl}/chat`, request, { headers });
  }
}
