import { Injectable, NgZone } from '@angular/core';

/**
 * App-wide upload animation (works on library forms and custom screens alike).
 *
 * - Choosing a file in any <input type="file"> marks its visual container with
 *   .fv-file-chosen and data-fv-file="<name>" (styled as a file pill in styles.scss).
 * - Clicking a button that sits in the same section as a chosen file turns it into
 *   the animated "Uploading…" bar (.fv-uploading) while the HTTP calls it triggers
 *   are in flight, with real progress when the browser reports upload progress, then
 *   flips to "Completed" (.fv-upload-done) or shakes on failure (.fv-upload-failed).
 *
 * HTTP activity is observed by wrapping XMLHttpRequest (what Angular's HttpClient
 * uses), so no per-screen or per-interceptor wiring is needed. Started once from
 * AppComponent.
 */
@Injectable({ providedIn: 'root' })
export class UploadFxService {
  private started = false;
  private pending = 0;
  private failedSinceClick = false;
  private active: HTMLElement | null = null;
  private sawRequest = false;
  private startTimer?: ReturnType<typeof setTimeout>;
  private clearTimer?: ReturnType<typeof setTimeout>;

  constructor(private zone: NgZone) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.zone.runOutsideAngular(() => {
      this.patchXhr();
      document.addEventListener('change', (e) => this.onChange(e), true);
      document.addEventListener('click', (e) => this.onClick(e), true);
    });
  }

  /* ── File picked ─────────────────────────────────────────────────── */

  private onChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input || input.tagName !== 'INPUT' || input.type !== 'file') return;
    const box = this.fileBox(input);
    const name = input.files && input.files.length
      ? input.files.length > 1 ? `${input.files.length} files` : input.files[0].name
      : '';
    // Screens with an upload pill show the file themselves.
    if (!box || box.querySelector('.fv-upload-pill') || box.closest('.fv-upload-pill')) return;
    if (name) {
      box.setAttribute('data-fv-file', name);
      box.classList.remove('fv-file-chosen');
      void box.offsetWidth; // restart the pop animation
      box.classList.add('fv-file-chosen');
    } else {
      box.removeAttribute('data-fv-file');
      box.classList.remove('fv-file-chosen');
    }
  }

  /** The element the user sees for this file input (library box, custom label, or the input's parent). */
  private fileBox(input: HTMLInputElement): HTMLElement | null {
    return (
      (input.closest('.fv-file-selector-box, .upload-container, .file-upload, .upload-box, .upload-area, .file-input-wrapper, .upload-btn') as HTMLElement | null) ||
      (input.id ? (document.querySelector(`label[for="${CSS.escape(input.id)}"]`) as HTMLElement | null) : null) ||
      input.parentElement
    );
  }

  /* ── Upload clicked ──────────────────────────────────────────────── */

  private onClick(e: Event): void {
    const btn = (e.target as HTMLElement)?.closest?.('button, input[type="submit"]') as HTMLElement | null;
    if (!btn || (btn as HTMLButtonElement).disabled || this.active) return;
    // A button that opens the picker (wraps/labels the input) is not an upload action.
    if (btn.querySelector('input[type="file"]') || btn.closest('label')) return;
    // Screens that drive their own upload pill state opt out.
    if (btn.closest('[data-fv-upload-manual]')) return;
    if (/^(back|cancel|close|reset|clear|download|export|template|sample)/i.test((btn.textContent || '').trim())) return;
    if (!this.hasChosenFileNear(btn)) return;

    this.active = btn;
    this.sawRequest = false;
    this.failedSinceClick = false;
    clearTimeout(this.clearTimer);
    btn.classList.remove('fv-upload-done', 'fv-upload-failed');
    btn.style.setProperty('--fv-upload-progress', '0');
    btn.classList.add('fv-uploading');
    // Nothing went out (e.g. client-side validation stopped it) - back to normal.
    this.startTimer = setTimeout(() => {
      if (!this.sawRequest) this.finish(false, true);
    }, 1200);
  }

  private hasChosenFileNear(btn: HTMLElement): boolean {
    let node: HTMLElement | null = btn;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      const inputs = node.querySelectorAll?.('input[type="file"]') as NodeListOf<HTMLInputElement> | undefined;
      if (inputs && inputs.length) {
        return Array.from(inputs).some((i) => i.files && i.files.length > 0) ||
          !!node.querySelector('.fv-file-chosen, .fv-upload-pill.has-file');
      }
      if (node.matches?.('lib-query-form, lib-add-update-form, form, section, .card, mat-card')) {
        // keep climbing one more container: many screens put the button outside the form
        continue;
      }
    }
    // Last resort: one chosen file on the whole page (single-upload screens)
    return document.querySelectorAll('.fv-file-chosen, .fv-upload-pill.has-file').length === 1;
  }

  private finish(ok: boolean, silent = false): void {
    const btn = this.active;
    this.active = null;
    clearTimeout(this.startTimer);
    if (!btn) return;
    btn.classList.remove('fv-uploading', 'fv-upload-determinate');
    btn.style.removeProperty('--fv-upload-progress');
    if (silent) return;
    // The save may have been rejected with a 200 + error message - trust a visible error toast over the status code.
    if (ok && document.querySelector('.red-snackbar, .error-snackbar, .toast-error, .mat-mdc-snack-bar-container.red-snackbar')) ok = false;
    btn.classList.add(ok ? 'fv-upload-done' : 'fv-upload-failed');
    this.clearTimer = setTimeout(() => btn.classList.remove('fv-upload-done', 'fv-upload-failed'), ok ? 2200 : 900);
  }

  /* ── HTTP observation ────────────────────────────────────────────── */

  private patchXhr(): void {
    const self = this;
    const proto = XMLHttpRequest.prototype;
    const originalOpen = proto.open;
    const originalSend = proto.send;
    proto.open = function (this: XMLHttpRequest, method: string, ...rest: any[]) {
      (this as any).__fvMethod = String(method || 'GET').toUpperCase();
      return (originalOpen as any).call(this, method, ...rest);
    } as any;
    proto.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
      // Only writes count as "the upload" - lookups/validation GETs fired by the same click are ignored.
      const isWrite = ((this as any).__fvMethod || 'GET') !== 'GET';
      if (self.active && isWrite) {
        self.sawRequest = true;
        self.pending++;
        const btn = self.active;
        if (body instanceof FormData || body instanceof Blob) {
          this.upload?.addEventListener('progress', (ev) => {
            if (ev.lengthComputable && ev.total > 0) {
              btn.style.setProperty('--fv-upload-progress', String(Math.min(1, ev.loaded / ev.total)));
              btn.classList.add('fv-upload-determinate');
            }
          });
        }
        this.addEventListener('loadend', () => {
          if (this.status === 0 || this.status >= 400) self.failedSinceClick = true;
          self.pending = Math.max(0, self.pending - 1);
          // Let follow-up calls (refresh lists etc.) start before deciding we're done.
          setTimeout(() => {
            if (self.pending === 0 && self.active === btn) self.finish(!self.failedSinceClick);
          }, 350);
        });
      }
      return originalSend.call(this, body as any);
    };
  }
}
