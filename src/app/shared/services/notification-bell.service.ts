import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { EnvironmentUrlService } from './environment-url.service';

// Mirrors ALMS_Microservice's NotificationResponseDto - the same backend/shape
// the mobile app already reads from (check-in/out, leave, reimbursement, loan
// approvals), plus a 'BulkEmployeeRegistration' type Employee_Services dispatches
// after a bulk employee upload's login-account creation finishes.
export interface NotificationItem {
  notificationId: string;
  title: string;
  body: string;
  type: string;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdDate: string;
}

// Mirrors ALMS_Microservice's NotificationPreferencesDto - same per-employee,
// per-category on/off switches the mobile app's settings screen edits
// (MobileApp/app/employeeSelfService/settings/index.tsx's PREFERENCE_ITEMS).
// A row that doesn't exist yet server-side is returned with every flag true
// (see GetNotificationPreferencesQueryHandler) - nothing to special-case here.
export interface NotificationPreferences {
  employeeId: string;
  leaveEnabled: boolean;
  loanEnabled: boolean;
  reimbursementEnabled: boolean;
  regularizationEnabled: boolean;
  checkInOutEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationBellService {
  private get base(): string {
    return this.env.almsUrlAddress;
  }

  constructor(private http: HttpClient, private env: EnvironmentUrlService) {}

  /**
   * Items waiting on the signed-in manager in Progress Tracker (KPI/goal updates, tasks marked done).
   * Live count, so it clears as soon as they're handled anywhere. 0 for non-managers.
   */
  getPendingApprovalCount(): Observable<{ total: number }> {
    if (!this.env.progressUrlAddress) return of({ total: 0 });
    return this.http.get<{ total: number }>(`${this.env.progressUrlAddress}/api/Approvals/count`, {
      headers: new HttpHeaders({ 'X-Skip-Loader': 'true' }),
    });
  }

  getNotifications(employeeId: string): Observable<NotificationItem[]> {
    // Polled in the background for the bell badge - never show the global loader for this.
    return this.http.get<NotificationItem[]>(`${this.base}/api/Notification/GetNotifications`, {
      params: { employeeId },
      headers: new HttpHeaders({ 'X-Skip-Loader': 'true' }),
    });
  }

  markNotificationRead(notificationId: string): Observable<any> {
    return this.http.post(`${this.base}/api/Notification/MarkNotificationRead`, { notificationId });
  }

  markAllNotificationsRead(employeeId: string): Observable<any> {
    return this.http.post(`${this.base}/api/Notification/MarkAllNotificationsRead`, { employeeId });
  }

  getPreferences(employeeId: string): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.base}/api/Notification/GetNotificationPreferences`, {
      params: { employeeId },
    });
  }

  updatePreferences(preferences: NotificationPreferences): Observable<any> {
    return this.http.post(`${this.base}/api/Notification/UpdateNotificationPreferences`, preferences);
  }
}
