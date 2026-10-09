// Fovestta Desktop build only (tsconfig.desktop.json maps '@fovestta2/chat-widget-fovestta' here).
//
// The real chat widget is linked from ../SD_Nemo_Front_Controls/dist/chat-widget, which is not
// published to npm and is unavailable where the desktop app is built. This stand-in has the same
// shape as the parts AAA_MFE uses (app.component.ts / app.component.html) and renders nothing, so
// the desktop build works without it and the chat icon is simply absent.
//
// Not part of the production, development or bubna builds: this folder is outside src/ and only
// tsconfig.desktop.json refers to it. Delete it once the widget is installable from npm.
import { Component, Input } from '@angular/core';

export interface ChatWidgetConfig {
  chatBaseUrl: string;
  getAccessToken: () => string | null;
  getTenantSchema: () => string;
  getCurrentEmployeeId: () => string | null;
}

export interface EmployeeContact {
  employeeId: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'lib-chat-icon',
  standalone: true,
  template: '',
})
export class ChatIconComponent {
  @Input() config: ChatWidgetConfig | null = null;
  @Input() contacts: EmployeeContact[] = [];
}
