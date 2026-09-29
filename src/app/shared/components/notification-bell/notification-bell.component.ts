import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationBellService, NotificationItem, NotificationPreferences } from '../../services/notification-bell.service';

// Same 90-day poll interval philosophy as the mobile app's badge - 30s is
// frequent enough that "your bulk upload finished" shows up promptly without
// hammering ALMS on every tab.
const POLL_INTERVAL_MS = 30000;

// Mirrors MobileApp/app/employeeSelfService/settings/index.tsx's PREFERENCE_ITEMS
// exactly (same five types, same order) so the two settings surfaces stay in sync.
type PreferenceKey = Exclude<keyof NotificationPreferences, 'employeeId'>;

interface PreferenceItem {
  key: PreferenceKey;
  title: string;
  description: string;
}

const PREFERENCE_ITEMS: PreferenceItem[] = [
  { key: 'leaveEnabled', title: 'Leave', description: 'Leave requests awaiting your approval' },
  { key: 'loanEnabled', title: 'Loan', description: 'Loan requests awaiting your approval' },
  { key: 'reimbursementEnabled', title: 'Reimbursement', description: 'Reimbursement requests awaiting your approval' },
  { key: 'regularizationEnabled', title: 'Regularization', description: 'Regularization requests awaiting your approval' },
  { key: 'checkInOutEnabled', title: 'Daily Check-in/out', description: 'Check-in/out activity for you and your team' },
];

@Component({
  standalone: true,
  selector: 'app-notification-bell',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  showDropdown = false;
  loading = false;

  readonly preferenceItems = PREFERENCE_ITEMS;
  showPreferences = false;
  preferences: NotificationPreferences | null = null;
  preferencesLoading = false;

  private employeeId: string | null = null;
  private pollSub?: Subscription;

  constructor(
    private notificationSvc: NotificationBellService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.employeeId = this.resolveEmployeeId();
    if (!this.employeeId) return;

    this.pollSub = interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => {
          this.loading = true;
          return this.notificationSvc.getNotifications(this.employeeId!).pipe(
            catchError(() => of([] as NotificationItem[])),
          );
        }),
      )
      .subscribe((items) => {
        this.notifications = items;
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private resolveEmployeeId(): string | null {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      return parsed?.id || parsed?.employeeId || null;
    } catch {
      return null;
    }
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  get show(): boolean {
    return !!this.employeeId;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showDropdown) {
      this.showDropdown = false;
      this.showPreferences = false;
      this.cdr.markForCheck();
    }
  }

  onNotificationClick(n: NotificationItem): void {
    if (n.isRead) return;
    n.isRead = true; // optimistic - avoids waiting on the round trip to update the badge
    this.notificationSvc.markNotificationRead(n.notificationId).subscribe({
      error: () => { n.isRead = false; this.cdr.markForCheck(); },
    });
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    if (!this.employeeId || this.unreadCount === 0) return;
    const previouslyUnread = this.notifications.filter((n) => !n.isRead);
    this.notifications.forEach((n) => (n.isRead = true));
    this.notificationSvc.markAllNotificationsRead(this.employeeId).subscribe({
      error: () => { previouslyUnread.forEach((n) => (n.isRead = false)); this.cdr.markForCheck(); },
    });
  }

  toggleSettings(event: Event): void {
    event.stopPropagation();
    this.showPreferences = !this.showPreferences;
    if (this.showPreferences && !this.preferences && this.employeeId) {
      this.preferencesLoading = true;
      this.notificationSvc.getPreferences(this.employeeId).subscribe({
        next: (prefs) => { this.preferences = prefs; this.preferencesLoading = false; this.cdr.markForCheck(); },
        error: () => { this.preferencesLoading = false; this.cdr.markForCheck(); },
      });
    }
  }

  onPreferenceToggle(item: PreferenceItem, enabled: boolean): void {
    if (!this.preferences) return;
    const previous = this.preferences[item.key];
    this.preferences = { ...this.preferences, [item.key]: enabled };
    this.notificationSvc.updatePreferences(this.preferences).subscribe({
      error: () => {
        // revert - the toggle didn't actually take effect server-side
        this.preferences = this.preferences ? { ...this.preferences, [item.key]: previous } : this.preferences;
        this.cdr.markForCheck();
      },
    });
  }

  iconFor(type: string): string {
    switch (type) {
      case 'LeaveRequest': return 'event_busy';
      case 'ReimbursementRequest': return 'receipt_long';
      case 'LoanRequest': return 'account_balance_wallet';
      case 'RegularizationRequest': return 'edit_calendar';
      case 'CheckInOut': return 'fingerprint';
      case 'BulkEmployeeRegistration': return 'group_add';
      default: return 'notifications';
    }
  }

  timeAgo(createdDate: string): string {
    const diffMs = Date.now() - new Date(createdDate).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
