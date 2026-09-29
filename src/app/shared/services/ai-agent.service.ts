import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
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

export interface AttendanceRow {
  employeeCode: string;
  presentDays: number;
  workingDays: number;
  totalDaysPayable: number;
  absentDays: number;
  weekOffDays: number;
  holidays: number;
  leavesAvailed: number;
  normalDayOvertime: number;
}

export interface AttendanceUploadRequest {
  month: string;
  year: string;
  rows: AttendanceRow[];
}

export interface TdsRow {
  employeeCode: string;
  tdsAmount: number;
  regime: string;
}

export interface TdsUploadRequest {
  branchId?: string;
  rows: TdsRow[];
}

@Injectable({ providedIn: 'root' })
export class AiAgentService {
  private readonly baseUrl = '/Auth/sdapi/api/HRMSAgent';
  private http: HttpClient;

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  private buildHeaders(): HttpHeaders {
    let raw = sessionStorage.getItem('token') ?? '';
    try { raw = JSON.parse(raw); } catch {}
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${raw}`,
    });
  }

  chat(request: AgentChatRequest): Observable<AgentChatResponse> {
    return this.http.post<AgentChatResponse>(
      `${this.baseUrl}/chat`, request, { headers: this.buildHeaders() }
    );
  }

  uploadAttendance(request: AttendanceUploadRequest): Observable<AgentChatResponse> {
    return this.http.post<AgentChatResponse>(
      `${this.baseUrl}/upload-attendance`, request, { headers: this.buildHeaders() }
    );
  }

  processSalary(request: AttendanceUploadRequest & { branchId?: string }): Observable<AgentChatResponse> {
    return this.http.post<AgentChatResponse>(
      `${this.baseUrl}/process-salary`, request, { headers: this.buildHeaders() }
    );
  }

  uploadTds(request: TdsUploadRequest): Observable<AgentChatResponse> {
    return this.http.post<AgentChatResponse>(
      `${this.baseUrl}/upload-tds`, request, { headers: this.buildHeaders() }
    );
  }
}
