import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { EnvironmentUrlService } from '../../shared/services/environment-url.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ThemeService } from '../../shared/services/theme.service';

interface SsoConnection {
  displayName: string;
  issuer: string;
  clientId: string;
  clientSecret?: string | null;
  emailDomains: string;
  enforced: boolean;
  breakGlassEmails?: string | null;
  isActive: boolean;
  hasSecret?: boolean;
  lastSuccessAt?: string | null;
  callbackUrl?: string;
  exists?: boolean;
}

const PRESETS: { name: string; issuer: string; help: string }[] = [
  { name: 'Microsoft', issuer: 'https://login.microsoftonline.com/<directory-tenant-id>/v2.0',
    help: 'Entra ID → App registrations → New registration (Web). Add the redirect URI below, create a client secret, and copy the Directory (tenant) ID into the issuer.' },
  { name: 'Okta', issuer: 'https://<your-org>.okta.com',
    help: 'Okta Admin → Applications → Create App Integration → OIDC, Web Application. Sign-in redirect URI = the URL below.' },
  { name: 'Google', issuer: 'https://accounts.google.com',
    help: 'Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application). Authorised redirect URI = the URL below.' }
];

/** Company single sign-on (OpenID Connect) settings. Admins only; the API enforces it. */
@Component({
  standalone: true,
  selector: 'app-sso-settings',
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="sso-page">
      <header>
        <h1>Single sign-on</h1>
        <p>Let employees sign in with your company's Microsoft, Okta or Google account instead of a separate password.
          Works on the web and in the mobile app. Only people who already have a Fovestta account can sign in.</p>
      </header>

      <div class="banner err" *ngIf="error">{{ error }}</div>
      <div class="muted" *ngIf="loading">Loading…</div>

      <ng-container *ngIf="!loading && c">
        <section class="card">
          <h2>1 · Register Fovestta with your identity provider</h2>
          <div class="presets">
            <button type="button" *ngFor="let p of presets" [class.on]="preset === p.name" (click)="pick(p)">{{ p.name }}</button>
          </div>
          <p class="small" *ngIf="presetHelp">{{ presetHelp }}</p>
          <label class="f"><span>Redirect URI (paste this into the provider)</span>
            <div class="copy"><input [value]="c.callbackUrl" readonly /><button type="button" (click)="copy(c.callbackUrl)"><mat-icon>content_copy</mat-icon></button></div></label>
          <p class="small muted">Scopes: <code>openid email profile</code>. The provider must send the user's email.</p>
        </section>

        <section class="card">
          <h2>2 · Connect</h2>
          <div class="grid">
            <label class="f"><span>Button label</span><input [(ngModel)]="c.displayName" placeholder="Microsoft" maxlength="100" /></label>
            <label class="f wide"><span>Issuer URL</span><input [(ngModel)]="c.issuer" placeholder="https://login.microsoftonline.com/…/v2.0" /></label>
            <label class="f"><span>Client (application) ID</span><input [(ngModel)]="c.clientId" /></label>
            <label class="f"><span>Client secret</span><input type="password" [(ngModel)]="c.clientSecret" [placeholder]="c.hasSecret ? 'Saved (leave blank to keep)' : ''" autocomplete="new-password" /></label>
            <label class="f wide"><span>Company email domains</span><input [(ngModel)]="c.emailDomains" placeholder="acme.com, acme.in" />
              <small>Only these domains can use SSO, and only for people in this company.</small></label>
          </div>
          <label class="check"><input type="checkbox" [(ngModel)]="c.isActive" /><span>Single sign-on is on (shows "Continue with {{ c.displayName || 'SSO' }}" on the login page)</span></label>
          <div class="act-row">
            <button type="button" class="ghost" [disabled]="busy || !c.issuer" (click)="test()">Test issuer</button>
            <span class="small ok" *ngIf="testResult">✓ Found {{ testResult }}</span>
          </div>
        </section>

        <section class="card">
          <h2>3 · Require SSO (optional)</h2>
          <p class="small">When required, passwords stop working for everyone in your company except the break-glass admins below,
            so you can still get in if the identity provider has an outage.</p>
          <p class="small" [class.ok]="c.lastSuccessAt" [class.warn]="!c.lastSuccessAt">
            {{ c.lastSuccessAt ? 'Last successful SSO sign-in: ' + (c.lastSuccessAt | date: 'd MMM y, h:mm a') : 'No successful SSO sign-in yet with these settings: save, then sign out and try "Continue with SSO" before requiring it.' }}</p>
          <label class="f wide"><span>Break-glass admin emails (can always use a password)</span>
            <input [(ngModel)]="c.breakGlassEmails" placeholder="it.admin@acme.com, hr.head@acme.com" /></label>
          <label class="check"><input type="checkbox" [(ngModel)]="c.enforced" [disabled]="!c.lastSuccessAt" /><span>Require single sign-on</span></label>
        </section>

        <div class="act-row end">
          <button type="button" class="primary" [disabled]="busy" (click)="save()">{{ busy ? 'Saving…' : 'Save' }}</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--fv-surface-2, #f6f7fb); min-height: 100%; color: var(--fv-text, #1f2937); }
    .sso-page { max-width: 880px; margin: 0 auto; padding: 24px 16px 60px; }
    h1 { margin: 0 0 6px; font-size: 24px; } header p { margin: 0 0 18px; color: var(--fv-text-2, #4b5563); }
    .card { background: var(--fv-surface-solid, #fff); border: 1px solid var(--fv-border, #e5e7eb); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
    h2 { margin: 0 0 12px; font-size: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px 14px; margin-bottom: 12px; }
    .wide { grid-column: 1 / -1; }
    label.f { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; font-weight: 600; color: var(--fv-text-2, #4b5563); margin-bottom: 8px; }
    label.f small { font-weight: 400; color: var(--fv-text-3, #6b7280); }
    input { height: 38px; padding: 0 10px; border: 1px solid var(--fv-border-strong, #d1d5db); border-radius: 9px; font: inherit; font-weight: 400;
      color: var(--fv-text, #111827); background: var(--fv-surface-solid, #fff); }
    .copy { display: flex; gap: 6px; } .copy input { flex: 1; }
    .copy button { border: 1px solid var(--fv-border-strong, #d1d5db); background: transparent; border-radius: 9px; cursor: pointer; color: inherit; }
    .check { display: flex; gap: 8px; align-items: center; font-size: 13.5px; margin: 6px 0; }
    .check input { height: 16px; width: 16px; }
    .presets { display: flex; gap: 8px; margin-bottom: 8px; }
    .presets button { padding: 6px 14px; border-radius: 999px; border: 1px solid var(--fv-border-strong, #d1d5db); background: transparent; cursor: pointer; color: inherit; }
    .presets button.on { border-color: var(--fv-accent, #4f46e5); background: var(--fv-accent-soft, #eef2ff); color: var(--fv-accent-text, #4338ca); }
    .act-row { display: flex; align-items: center; gap: 10px; } .act-row.end { justify-content: flex-end; }
    button.primary, button.ghost { height: 40px; padding: 0 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
    button.primary { border: none; background: var(--fv-accent, #4f46e5); color: #fff; }
    button.ghost { border: 1px solid var(--fv-border-strong, #d1d5db); background: transparent; color: var(--fv-accent-text, #4338ca); }
    button:disabled { opacity: .55; cursor: default; }
    .small { font-size: 12.5px; } .muted { color: var(--fv-text-3, #6b7280); }
    .ok { color: var(--fv-success, #059669); } .warn { color: var(--fv-warning, #b45309); }
    .banner.err { padding: 12px 14px; border-radius: 12px; background: var(--fv-danger-soft, #fef2f2); color: var(--fv-danger, #b91c1c); margin-bottom: 12px; }
    code { background: var(--fv-surface-2, #f3f4f6); padding: 1px 6px; border-radius: 6px; }
  `]
})
export class SsoSettingsComponent implements OnInit {
  c?: SsoConnection;
  presets = PRESETS;
  preset = '';
  presetHelp = '';
  loading = true;
  busy = false;
  error = '';
  testResult = '';

  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentUrlService);
  private readonly notify = inject(NotificationService);
  private readonly release = (() => {
    const r = inject(ThemeService).claimNative();
    inject(DestroyRef).onDestroy(r);
    return r;
  })();

  private get api() { return `${this.env.urlAddress}/api/Sso/connection`; }

  ngOnInit(): void {
    this.http.get<SsoConnection>(this.api).subscribe({
      next: c => { this.c = { ...c, clientSecret: '' }; this.loading = false; },
      error: err => { this.loading = false; this.error = err?.status === 403 ? 'Only administrators can manage single sign-on.' : this.msg(err, 'Could not load the SSO settings.'); }
    });
  }

  pick(p: { name: string; issuer: string; help: string }): void {
    if (!this.c) return;
    this.preset = p.name;
    this.presetHelp = p.help;
    if (!this.c.displayName) this.c.displayName = p.name;
    if (!this.c.issuer || PRESETS.some(x => x.issuer === this.c!.issuer)) this.c.issuer = p.issuer;
  }

  test(): void {
    this.busy = true;
    this.testResult = '';
    this.http.post<any>(`${this.api}/test`, { issuer: this.c!.issuer }).subscribe({
      next: r => { this.busy = false; this.testResult = `${r.issuer} with ${r.signingKeys} signing key(s)`; },
      error: err => { this.busy = false; this.notify.showError(this.msg(err, 'Could not reach that issuer.')); }
    });
  }

  save(): void {
    this.busy = true;
    this.error = '';
    this.http.put<SsoConnection>(this.api, this.c).subscribe({
      next: c => { this.busy = false; this.c = { ...c, clientSecret: '' }; this.notify.showSuccess('Single sign-on settings saved'); },
      error: err => { this.busy = false; this.error = this.msg(err, 'Could not save the settings.'); }
    });
  }

  copy(text?: string): void { if (text) navigator.clipboard?.writeText(text); this.notify.showSuccess('Copied'); }

  private msg(err: any, fallback: string): string { return err?.error?.message || fallback; }
}
