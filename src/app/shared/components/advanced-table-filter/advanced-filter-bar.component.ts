import { Component, DoCheck, ElementRef, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
import { GlobalTableSearchDirective } from '../../directives/global-table-search.directive';

type ColumnFilterType = 'enum' | 'number' | 'date' | 'text';

interface ColumnMeta {
  field: string;
  header: string;
  type: ColumnFilterType;
  options?: { label: string; value: any }[];
}

interface FilterRow {
  field: string;
  type: ColumnFilterType;
  operator: string;
  value?: any;
  value2?: any;
  selected?: Set<string>;
}

const OPERATORS = {
  number: [
    { label: '=', value: 'eq' },
    { label: '!=', value: 'neq' },
    { label: '>', value: 'gt' },
    { label: '>=', value: 'gte' },
    { label: '<', value: 'lt' },
    { label: '<=', value: 'lte' },
  ],
  date: [
    { label: 'On', value: 'eq' },
    { label: 'Before', value: 'lt' },
    { label: 'After', value: 'gt' },
    { label: 'On or before', value: 'lte' },
    { label: 'On or after', value: 'gte' },
    { label: 'Between', value: 'between' },
  ],
  text: [
    { label: 'Contains', value: 'contains' },
    { label: 'Equals', value: 'eq' },
    { label: 'Starts with', value: 'startswith' },
  ],
};

const IGNORED_FIELDS = new Set(['sno', 'select', 'action', 'actions', 'image', 'photo']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}([T\s].*)?$|^\d{2}[-\/]\d{2}[-\/]\d{4}$/;

@Component({
  standalone: true,
  selector: 'app-advanced-filter-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-filter-bar.component.html',
  styleUrls: ['./advanced-filter-bar.component.scss'],
})
export class AdvancedFilterBarComponent implements DoCheck {
  @Input() table!: NemoReusableTblComponent;
  @Input() searchDirective?: GlobalTableSearchDirective | null;

  readonly OPERATORS = OPERATORS;

  isOpen = false;
  columns: ColumnMeta[] = [];
  rows: FilterRow[] = [];
  pendingField = '';

  private lastDataRef: any[] | null = null;
  private lastDataLength = -1;
  private ownOriginalData: any[] = [];

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  get availableColumns(): ColumnMeta[] {
    return this.columns.filter((c) => !this.rows.some((r) => r.field === c.field));
  }

  get activeFilterCount(): number {
    return this.rows.filter((r) => this.isRowActive(r)).length;
  }

  ngDoCheck(): void {
    if (!this.table) {
      return;
    }

    if (this.searchDirective) {
      const data = this.searchDirective.getOriginalData();
      if (data !== this.lastDataRef || data.length !== this.lastDataLength) {
        this.lastDataRef = data;
        this.lastDataLength = data.length;
        this.buildColumnMeta(data);
      }
      return;
    }

    const current = this.table.dataSource || [];
    if (current !== this.lastDataRef || current.length !== this.lastDataLength) {
      this.lastDataRef = current;
      this.lastDataLength = current.length;
      if (!this.buildPredicate() || !this.ownOriginalData.length) {
        this.ownOriginalData = [...current];
        this.buildColumnMeta(this.ownOriginalData);
      }
    }
  }

  getHeader(field: string): string {
    return this.columns.find((c) => c.field === field)?.header || field;
  }

  getOptions(field: string): { label: string; value: any }[] {
    return this.columns.find((c) => c.field === field)?.options || [];
  }

  toKey(value: any): string {
    return String(value);
  }

  addFilterRow(field: string): void {
    if (!field) {
      return;
    }
    const col = this.columns.find((c) => c.field === field);
    if (!col) {
      return;
    }
    const row: FilterRow = { field, type: col.type, operator: this.defaultOperator(col.type) };
    if (col.type === 'enum') {
      row.selected = new Set((col.options || []).map((o) => this.toKey(o.value)));
    }
    this.rows.push(row);
    this.pendingField = '';
    this.applyFilters();
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
    this.applyFilters();
  }

  clearAll(): void {
    this.rows = [];
    this.applyFilters();
  }

  toggleEnumValue(row: FilterRow, value: any): void {
    const key = this.toKey(value);
    if (!row.selected) {
      row.selected = new Set();
    }
    if (row.selected.has(key)) {
      row.selected.delete(key);
    } else {
      row.selected.add(key);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    const predicate = this.buildPredicate();
    if (this.searchDirective) {
      this.searchDirective.setAdvancedPredicate(predicate);
      return;
    }

    const source = this.ownOriginalData;
    const filtered = predicate ? source.filter(predicate) : [...source];
    this.table.dataSource = filtered;
    this.table.filteredData = filtered;
    this.table.currentPage = 1;
    this.table.calculateTotalPages();
  }

  private defaultOperator(type: ColumnFilterType): string {
    if (type === 'number') return 'eq';
    if (type === 'date') return 'eq';
    if (type === 'text') return 'contains';
    return '';
  }

  private isRowActive(row: FilterRow): boolean {
    if (row.type === 'enum') {
      const col = this.columns.find((c) => c.field === row.field);
      const total = col?.options?.length ?? 0;
      return !!row.selected && row.selected.size < total;
    }
    if (row.type === 'date') {
      return !!row.value;
    }
    if (row.type === 'number') {
      return row.value !== undefined && row.value !== null && row.value !== '';
    }
    return !!row.value;
  }

  private buildPredicate(): ((row: any) => boolean) | null {
    const activeRows = this.rows.filter((r) => this.isRowActive(r));
    if (!activeRows.length) {
      return null;
    }
    return (row: any) => activeRows.every((r) => this.matchesRow(row, r));
  }

  private matchesRow(rowData: any, filterRow: FilterRow): boolean {
    const value = rowData?.[filterRow.field];
    switch (filterRow.type) {
      case 'enum': {
        if (!filterRow.selected || filterRow.selected.size === 0) {
          return false;
        }
        return filterRow.selected.has(this.toKey(value));
      }
      case 'number': {
        const target = Number(filterRow.value);
        if (isNaN(target)) {
          return true;
        }
        return this.compareNumber(value, filterRow.operator, target);
      }
      case 'date': {
        const target = this.parseDate(filterRow.value);
        if (!target) {
          return true;
        }
        const target2 = filterRow.value2 ? this.parseDate(filterRow.value2) ?? undefined : undefined;
        return this.compareDate(value, filterRow.operator, target, target2);
      }
      default: {
        if (!filterRow.value) {
          return true;
        }
        return this.matchText(value, filterRow.operator, String(filterRow.value));
      }
    }
  }

  private compareNumber(rowVal: any, op: string, target: number): boolean {
    const num = Number(rowVal);
    if (isNaN(num)) {
      return false;
    }
    switch (op) {
      case 'eq': return num === target;
      case 'neq': return num !== target;
      case 'gt': return num > target;
      case 'gte': return num >= target;
      case 'lt': return num < target;
      case 'lte': return num <= target;
      default: return true;
    }
  }

  private compareDate(rowVal: any, op: string, target: Date, target2?: Date): boolean {
    const d = this.parseDate(rowVal);
    if (!d) {
      return false;
    }
    const dt = d.getTime();
    const t = target.getTime();
    switch (op) {
      case 'eq': return dt === t;
      case 'gt': return dt > t;
      case 'gte': return dt >= t;
      case 'lt': return dt < t;
      case 'lte': return dt <= t;
      case 'between': return target2 ? dt >= t && dt <= target2.getTime() : dt >= t;
      default: return true;
    }
  }

  private matchText(rowVal: any, op: string, target: string): boolean {
    const s = (rowVal ?? '').toString().toLowerCase();
    const t = target.toLowerCase();
    switch (op) {
      case 'contains': return s.includes(t);
      case 'eq': return s === t;
      case 'startswith': return s.startsWith(t);
      default: return true;
    }
  }

  private parseDate(value: any): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    const s = String(value).trim();
    let m = s.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
    if (m) {
      return new Date(+m[3], +m[2] - 1, +m[1]);
    }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return new Date(+m[1], +m[2] - 1, +m[3]);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  private buildColumnMeta(data: any[]): void {
    const cols = Array.isArray(this.table.columns) ? this.table.columns : [];
    const sample = data.slice(0, 200);
    const meta: ColumnMeta[] = [];

    for (const col of cols as any[]) {
      if (!this.isFilterableColumn(col)) {
        continue;
      }
      const values = sample
        .map((r) => r?.[col.field])
        .filter((v) => v !== null && v !== undefined && v !== '');
      const type = this.detectType(values);
      const m: ColumnMeta = { field: col.field, header: col.header || col.field, type };
      if (type === 'enum') {
        m.options = this.buildEnumOptions(data, col.field);
      }
      meta.push(m);
    }

    this.columns = meta;
    this.rows = this.rows.filter((r) => meta.some((m) => m.field === r.field));
  }

  private isFilterableColumn(col: any): boolean {
    if (!col || typeof col.field !== 'string') {
      return false;
    }
    if (col.isImage) {
      return false;
    }
    const field = col.field.toLowerCase();
    const header = (col.header || '').toString().trim().toLowerCase();
    if (IGNORED_FIELDS.has(field)) {
      return false;
    }
    if (header === '#' || header === 'action' || header === 'actions') {
      return false;
    }
    return true;
  }

  private detectType(values: any[]): ColumnFilterType {
    if (!values.length) {
      return 'text';
    }
    if (values.every((v) => typeof v === 'boolean')) {
      return 'enum';
    }
    if (values.every((v) => typeof v === 'number' && !isNaN(v))) {
      return 'number';
    }
    if (values.every((v) => typeof v === 'string' && DATE_REGEX.test(v.trim()))) {
      return 'date';
    }
    const distinct = new Set(values.map((v) => String(v)));
    if (distinct.size > 1 && distinct.size <= 12) {
      return 'enum';
    }
    return 'text';
  }

  private buildEnumOptions(data: any[], field: string): { label: string; value: any }[] {
    const seen = new Map<string, any>();
    for (const row of data) {
      const v = row?.[field];
      if (v === null || v === undefined || v === '') {
        continue;
      }
      const key = this.toKey(v);
      if (!seen.has(key)) {
        seen.set(key, v);
      }
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => ({
        value: v,
        label: typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v),
      }));
  }
}
