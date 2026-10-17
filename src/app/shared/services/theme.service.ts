import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as DarkReader from 'darkreader';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'fv-theme';

/**
 * Shell-wide light/dark theme. The active mode is written to
 * <html data-theme="..."> (all colours come from the --fv-* tokens in
 * styles.scss) and broadcast to every embedded MFE iframe as
 * { type: 'THEME_CHANGED', theme } - the MFEs live on other origins, so they
 * can't read this app's localStorage and rely on that message instead (they
 * also send REQUEST_THEME on load, answered here).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly subject = new BehaviorSubject<ThemeMode>(this.readInitial());
  readonly theme$ = this.subject.asObservable();
  private nativeClaims = 0;
  private legacyDarkOn = false;

  constructor() {
    DarkReader.setFetchMethod(window.fetch.bind(window));
    this.apply(this.subject.value);

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'REQUEST_THEME' && event.source) {
        (event.source as Window).postMessage({ type: 'THEME_CHANGED', theme: this.current }, '*' as any);
      }

      // When this app itself runs embedded in another shell, follow that shell.
      if (data.type === 'THEME_CHANGED' && window !== window.parent && (data.theme === 'light' || data.theme === 'dark')) {
        this.set(data.theme, false);
      }
    });

    if (window !== window.parent) {
      window.parent.postMessage({ type: 'REQUEST_THEME' }, '*');
    }
  }

  get current(): ThemeMode {
    return this.subject.value;
  }

  get isDark(): boolean {
    return this.subject.value === 'dark';
  }

  toggle(): void {
    this.set(this.isDark ? 'light' : 'dark');
  }

  set(mode: ThemeMode, broadcast = true): void {
    this.subject.next(mode);
    this.persist();
    this.apply(mode);
    if (broadcast) this.broadcast();
  }

  /**
   * Shell pages built on the --fv-* tokens (Insights, initial setup, MFE iframe host)
   * call this from ngOnInit and the returned function from ngOnDestroy. Any other page
   * routed in the shell still has hard-coded light colours; in dark mode Dark Reader's
   * dynamic engine rewrites those styles into a dark version (light surfaces darkened,
   * dark elements and brand colours kept) while the shell chrome stays natively dark.
   */
  claimNative(): () => void {
    this.nativeClaims++;
    this.apply(this.subject.value);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.nativeClaims = Math.max(0, this.nativeClaims - 1);
      this.apply(this.subject.value);
    };
  }

  /** Re-save the current mode - logout wipes localStorage wholesale. */
  persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.subject.value);
    } catch {
      // storage unavailable (private mode etc.) - theme just won't survive a reload
    }
  }

  /** Push the current mode to every MFE iframe on the page. */
  broadcast(): void {
    document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
      iframe.contentWindow?.postMessage({ type: 'THEME_CHANGED', theme: this.subject.value }, '*');
    });
  }

  private apply(mode: ThemeMode): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
    const legacyDark = mode === 'dark' && this.nativeClaims === 0;
    root.classList.toggle('fv-legacy-dark', legacyDark);
    if (legacyDark && !this.legacyDarkOn) {
      DarkReader.enable(
        { brightness: 100, contrast: 100, sepia: 0, darkSchemeBackgroundColor: '#11131c', darkSchemeTextColor: '#e5e7eb' },
        {
          invert: [],
          // Brand logos sit on white plates in the shell chrome - keep those white.
          css: '.sidebar .logo-box, .header-brand .brand-logo { background-color: #ffffff !important; }',
          ignoreInlineStyle: [],
          ignoreImageAnalysis: ['*'],
          disableStyleSheetsProxy: false,
          ignoreCSSUrl: [],
        }
      );
      this.legacyDarkOn = true;
    } else if (!legacyDark && this.legacyDarkOn) {
      DarkReader.disable();
      this.legacyDarkOn = false;
    }
  }

  private readInitial(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'light';
  }
}
