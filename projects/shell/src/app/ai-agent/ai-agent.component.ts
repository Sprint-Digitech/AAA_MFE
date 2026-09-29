import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AiAgentService, ChatHistoryMessage, AgentChatResponse } from '../shared/services/ai-agent.service';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
  loading?: boolean;
}

@Component({
  selector: 'app-ai-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './ai-agent.component.html',
  styleUrls: ['./ai-agent.component.scss'],
})
export class AiAgentComponent implements AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  isOpen = false;
  userInput = '';
  messages: DisplayMessage[] = [];
  isLoading = false;
  history: ChatHistoryMessage[] = [];
  private branchId: string | undefined;

  private shouldScroll = false;

  constructor(private agentService: AiAgentService) {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      // Login response stores it as branchID (camelCase of BranchID)
      this.branchId = user?.branchID ?? user?.BranchID ?? user?.branchId ?? undefined;
    } catch {}
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.messages.push({
        role: 'assistant',
        content:
          'Namaste! 👋 Main aapka HRMS AI Agent hun.\n\nAap mujhse pooch sakte hain:\n• Salary / PF / ESI / TDS report\n• Attendance details\n• Employee profile / CTC\n\nExample: "March 2026 ki salary report do"',
        timestamp: new Date(),
      });
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    const loadingMsg: DisplayMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };
    this.messages.push(loadingMsg);

    this.agentService.chat({ message: text, history: this.history, branchId: this.branchId }).subscribe({
      next: (res: AgentChatResponse) => {
        this.messages = this.messages.filter((m) => !m.loading);
        this.isLoading = false;

        const content = res.clarificationNeeded
          ? res.clarificationQuestion ?? 'Kuch aur information chahiye.'
          : res.humanResponse || (res.error ?? 'Koi data nahi mila.');

        this.messages.push({
          role: 'assistant',
          content,
          data: res.data,
          timestamp: new Date(),
        });

        this.history.push({ role: 'user', content: text });
        this.history.push({ role: 'assistant', content });
        if (this.history.length > 12) this.history = this.history.slice(-12);

        this.shouldScroll = true;
      },
      error: () => {
        this.messages = this.messages.filter((m) => !m.loading);
        this.isLoading = false;
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, kuch error aa gayi. Thodi der baad try karein.',
          timestamp: new Date(),
        });
        this.shouldScroll = true;
      },
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  hasTableData(data: any): boolean {
    return Array.isArray(data) && data.length > 0;
  }

  getTableKeys(data: any[]): string[] {
    if (!data?.length) return [];
    return Object.keys(data[0]).filter((k) => {
      const v = data[0][k];
      return typeof v !== 'object' && !k.toLowerCase().endsWith('id');
    }).slice(0, 6);
  }

  getCellValue(row: unknown, key: string): string {
    const r = row as Record<string, unknown>;
    const v = r[key];
    if (v == null) return '—';
    if (typeof v === 'number') return v.toLocaleString('en-IN');
    return String(v);
  }

  getEmployeeName(row: unknown): string {
    const r = row as Record<string, any>;
    const d = r['employeeBasicDetail'];
    if (!d) return '';
    const first = d['employeeFirstName'] ?? '';
    const last = d['employeeLastName'] ?? '';
    return `${first} ${last}`.trim();
  }

  clearChat() {
    this.messages = [];
    this.history = [];
  }

  private scrollToBottom() {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}
