import { Injectable, NgZone } from '@angular/core';
import { GlobalSearchService } from './global-search.service';

/**
 * App-wide filter bar for hand-built list tables (library tables already have their own Filters menu).
 *
 * Any read-only list table matching TABLE_SELECTOR that has no search box of its own is searched by the
 * shell's header search box (GlobalSearchService - the app has one search box, not one per table), and
 * gets a glass bar above it with auto-detected dropdowns for low-cardinality columns (Status, Department,
 * Type...), a "x of y" count and Clear. Filtering only hides <tr>s - component data and logic are
 * untouched, and rows Angular re-renders are re-filtered by a MutationObserver.
 *
 * Opt a table out with data-fv-nofilter (on the table or any ancestor). Started once from AppComponent.
 */
const TABLE_SELECTOR = [
  'table.table', 'table.custom-table', 'table.modern-table', 'table.styled-table', 'table.data-table',
  'table.comparison-table', 'table.allocation-table', 'table.preview-table', 'table.ft-table',
  'table.mat-mdc-table',
].join(',');

const MIN_ROWS = 6;
const MAX_DROPDOWNS = 3;

interface Enhanced {
  bar: HTMLElement;
  selects: { col: number; el: HTMLSelectElement; sig: string }[];
  count: HTMLElement;
  clear: HTMLButtonElement;
}

@Injectable({ providedIn: 'root' })
export class TableFilterService {
  private started = false;
  private enhanced = new WeakMap<HTMLTableElement, Enhanced>();
  private timer?: ReturnType<typeof setTimeout>;
  private applying = false;
  /** Current header search term, lower-cased. */
  private term = '';

  constructor(private zone: NgZone, private globalSearch: GlobalSearchService) {}

  start(): void {
    if (this.started || typeof MutationObserver === 'undefined') return;
    this.started = true;
    this.zone.runOutsideAngular(() => {
      new MutationObserver(() => {
        if (this.applying) return;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.scan(), 250);
      }).observe(document.body, { childList: true, subtree: true });
      this.globalSearch.registerConsumer((term) => {
        this.term = (term || '').trim().toLowerCase();
        this.zone.runOutsideAngular(() => this.scan());
      });
      this.scan();
    });
  }

  private scan(): void {
    this.applying = true;
    try {
      document.querySelectorAll<HTMLTableElement>(TABLE_SELECTOR).forEach((t) => {
        const state = this.enhanced.get(t);
        if (state) {
          if (!state.bar.isConnected) this.placeBar(t, state.bar);
          this.syncOptions(t, state);
          this.apply(t, state);
        } else if (this.eligible(t)) {
          this.enhance(t);
        }
      });
    } finally {
      // Let our own DOM writes flush through the observer before listening again.
      setTimeout(() => (this.applying = false), 0);
    }
  }

  private bodyRows(t: HTMLTableElement): HTMLTableRowElement[] {
    const body = t.tBodies[0];
    if (!body) return [];
    return Array.from(body.rows).filter((r) => !r.classList.contains('fv-tf-empty') && r.cells.length > 1);
  }

  private eligible(t: HTMLTableElement): boolean {
    if (t.closest('[data-fv-nofilter], lib-nemo-reusable-tbl, mat-dialog-container, .cdk-overlay-container')) return false;
    if (t.classList.contains('tbl') || (t.getAttribute('style') || '').includes('460px')) return false;
    const rows = this.bodyRows(t);
    if (rows.length < MIN_ROWS) return false;
    // Editable grids (inputs in cells) are forms, not lists.
    if (t.querySelector('tbody input:not([type="checkbox"]), tbody select, tbody textarea')) return false;
    // Paginated mat-tables only hold one page - the screen's own filters apply there.
    const host = this.container(t);
    if (host.querySelector('mat-paginator, .mat-mdc-paginator')) return false;
    // The screen already has its own search box near the table.
    const scope = host.parentElement || host;
    if (scope.querySelector('input[type="search"], input[placeholder*="earch" i]')) return false;
    return true;
  }

  /** The element the bar goes in front of: the table's scroll wrapper when it has one. */
  private container(t: HTMLTableElement): HTMLElement {
    const p = t.parentElement;
    return p && p.children.length === 1 && p.tagName !== 'BODY' ? p : t;
  }

  private placeBar(t: HTMLTableElement, bar: HTMLElement): void {
    const anchor = this.container(t);
    anchor.parentElement?.insertBefore(bar, anchor);
  }

  private headers(t: HTMLTableElement): string[] {
    const head = t.tHead?.rows[t.tHead.rows.length - 1];
    return head ? Array.from(head.cells).map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim()) : [];
  }

  private cellText(r: HTMLTableRowElement, col: number): string {
    return (r.cells[col]?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /** Columns worth a dropdown: 2-12 distinct short text values that actually repeat. */
  private pickColumns(t: HTMLTableElement): number[] {
    const heads = this.headers(t);
    const rows = this.bodyRows(t);
    const picked: { col: number; score: number }[] = [];
    heads.forEach((h, col) => {
      if (!h || /^(#|s\.? ?no\.?|sr\.? ?no\.?|action|actions|select|edit|delete)$/i.test(h)) return;
      const values = new Set<string>();
      let numeric = 0;
      for (const r of rows) {
        const v = this.cellText(r, col);
        if (!v) continue;
        if (/^[-₹$\d.,:%\s/]+$/.test(v)) numeric++;
        if (v.length <= 40) values.add(v);
      }
      if (numeric > rows.length / 2) return;
      if (values.size < 2 || values.size > 12 || values.size > rows.length * 0.6) return;
      const priority = /status|type|department|designation|branch|source|category|role|mode|state|stage/i.test(h) ? 0 : 1;
      picked.push({ col, score: priority * 100 + values.size });
    });
    return picked.sort((a, b) => a.score - b.score).slice(0, MAX_DROPDOWNS).map((p) => p.col).sort((a, b) => a - b);
  }

  private enhance(t: HTMLTableElement): void {
    const heads = this.headers(t);
    const bar = document.createElement('div');
    bar.className = 'fv-tfilter';
    bar.setAttribute('data-fv-upload-manual', '');

    const selects = this.pickColumns(t).map((col) => {
      const wrap = document.createElement('label');
      wrap.className = 'fv-tf-select';
      const cap = document.createElement('span');
      cap.textContent = heads[col];
      const el = document.createElement('select');
      wrap.append(cap, el);
      bar.appendChild(wrap);
      return { col, el, sig: '' };
    });

    const count = document.createElement('span');
    count.className = 'fv-tf-count';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'fv-tf-clear';
    clear.innerHTML = '<span class="material-icons">filter_alt_off</span>Clear';
    bar.append(count, clear);

    const state: Enhanced = { bar, selects, count, clear };
    this.enhanced.set(t, state);
    this.syncOptions(t, state);
    this.placeBar(t, bar);
    // Nothing to offer without dropdowns - the header search still filters the table.
    bar.hidden = selects.length === 0;

    const run = () => { this.applying = true; this.apply(t, state); setTimeout(() => (this.applying = false), 0); };
    selects.forEach((s) => s.el.addEventListener('change', run));
    clear.addEventListener('click', () => {
      selects.forEach((s) => (s.el.value = ''));
      run();
    });
    this.apply(t, state);
  }

  /** Keep dropdown options in step with the rows currently rendered. */
  private syncOptions(t: HTMLTableElement, state: Enhanced): void {
    const rows = this.bodyRows(t);
    for (const s of state.selects) {
      const values = Array.from(new Set(rows.map((r) => this.cellText(r, s.col)).filter(Boolean))).sort();
      const sig = values.join('\u0001');
      if (sig === s.sig) continue;
      s.sig = sig;
      const current = s.el.value;
      s.el.innerHTML = '';
      s.el.add(new Option('All', ''));
      values.forEach((v) => s.el.add(new Option(v, v)));
      s.el.value = values.includes(current) ? current : '';
    }
  }

  private apply(t: HTMLTableElement, state: Enhanced): void {
    const rows = this.bodyRows(t);
    const q = this.term;
    const picks = state.selects.filter((s) => s.el.value);
    let shown = 0;
    for (const r of rows) {
      const ok =
        (!q || (r.textContent || '').toLowerCase().includes(q)) &&
        picks.every((s) => this.cellText(r, s.col) === s.el.value);
      const hidden = r.style.display === 'none' && r.hasAttribute('data-fv-tf-hidden');
      if (ok && hidden) { r.style.display = ''; r.removeAttribute('data-fv-tf-hidden'); }
      if (!ok && !hidden) { r.style.display = 'none'; r.setAttribute('data-fv-tf-hidden', ''); }
      if (ok) shown++;
    }
    const active = !!q || picks.length > 0;
    state.count.textContent = active ? `${shown} of ${rows.length}` : `${rows.length} rows`;
    // Clear resets the dropdowns only - the search term belongs to the header box.
    state.clear.hidden = picks.length === 0;
    state.bar.classList.toggle('is-active', active);
    state.bar.classList.toggle('is-empty', active && shown === 0);
  }
}
