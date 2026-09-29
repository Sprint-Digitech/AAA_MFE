import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly DEFAULT_DURATION = 5000;
  private readonly DEFAULT_POSITION: 'top' | 'bottom' = 'bottom';

  constructor(private snackBar: MatSnackBar) {}

  showSuccess(
    message: string,
    action: string = 'Okay',
    duration: number = this.DEFAULT_DURATION
  ): void {
    this.show(message, action, 'green-snackbar', duration);
  }

  showError(
    message: string,
    action: string = 'Close',
    duration: number = this.DEFAULT_DURATION
  ): void {
    this.show(message, action, 'red-snackbar', duration);
  }

  showInfo(
    message: string,
    action: string = 'Okay',
    duration: number = this.DEFAULT_DURATION
  ): void {
    this.show(message, action, 'blue-snackbar', duration);
  }

  showWarning(
    message: string,
    action: string = 'Okay',
    duration: number = this.DEFAULT_DURATION
  ): void {
    this.show(message, action, 'yellow-snackbar', duration);
  }

  private show(
    message: string,
    action: string,
    className: string,
    duration: number = this.DEFAULT_DURATION
  ): void {
    this.snackBar.open(this.toSafeMessage(message), action, {
      duration,
      verticalPosition: this.DEFAULT_POSITION,
      panelClass: [className],
    });
  }

  private toSafeMessage(message: string): string {
    if (!message) {
      return 'Something went wrong. Please try again.';
    }
    const looksLikeHtml = /<\s*(html|head|body|style|div|h\d|!doctype)\b/i.test(message);
    if (looksLikeHtml) {
      return 'Something went wrong. Please try again.';
    }
    return message.length > 300 ? `${message.slice(0, 300)}...` : message;
  }
}
