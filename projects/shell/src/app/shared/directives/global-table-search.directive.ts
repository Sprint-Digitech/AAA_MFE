import { Directive, DoCheck, Input, OnDestroy, OnInit } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
import { GlobalSearchService } from '../services/global-search.service';

@Directive({
    selector: 'lib-nemo-reusable-tbl',
    standalone: true,
})
export class GlobalTableSearchDirective implements OnInit, OnDestroy, DoCheck {
    @Input('appGlobalSearchKeys') searchKeys?: string[];
    private _disabled = false;
    @Input()
    set appGlobalSearchDisabled(value: boolean | string) {
        this._disabled = coerceBooleanProperty(value);
        this.applyFilter(this.currentTerm, false);
    }

    private unsubscribe?: () => void;
    private originalData: any[] = [];
    private lastDataSourceRef: any[] = [];
    private lastDataLength = 0;
    private currentTerm = '';
    private initialized = false;

    constructor(
        private table: NemoReusableTblComponent,
        private globalSearchService: GlobalSearchService
    ) { }

    ngOnInit(): void {
        this.enforceActionButtons();
        this.captureData();
        this.initialized = true;
        this.unsubscribe = this.globalSearchService.registerConsumer((term) => {
            this.currentTerm = term ?? '';
            this.applyFilter(this.currentTerm);
        });
    }
    ngOnDestroy(): void {
        this.unsubscribe?.();
    }
    ngDoCheck(): void {
        if (!this.initialized) {
            return;
        }
        this.enforceActionButtons();
        if (this.captureData()) {
            this.applyFilter(this.currentTerm, false, true);
        }
    }
    private enforceActionButtons(): void {
        const tableRef = this.table as unknown as {
            showDeleteOption?: boolean;
        };
        if (tableRef.showDeleteOption !== false) {
            tableRef.showDeleteOption = false;
        }
    }

    private captureData(allowOriginalUpdate = true): boolean {
        const current = this.table.dataSource || [];
        if (
            current !== this.lastDataSourceRef ||
            current.length !== this.lastDataLength
        ) {
            this.lastDataSourceRef = current;
            this.lastDataLength = current.length;
            if (allowOriginalUpdate && (!this.currentTerm || this._disabled)) {
                this.originalData = [...current];
            }
            if (!this.table.filteredData || !this.table.filteredData.length) {
                this.table.filteredData = [...this.originalData];
                this.table.currentPage = 1;
                this.table.calculateTotalPages();
            }
            return true;
        }
        return false;
    }

    private applyFilter(
        term: string,
        snapshot = true,
        preservePage = false
    ): void {
        if (!this.initialized) {
            return;
        }

        if (snapshot) {
            const allowUpdate = !!term;
            this.captureData(allowUpdate);
        }

        if (this._disabled) {
            this.table.dataSource = [...this.originalData];
            this.table.filteredData = [...this.originalData];
            if (!preservePage) {
                this.table.currentPage = 1;
            }
            this.table.calculateTotalPages();
            return;
        }

        const normalized = term ? term.toString().toLowerCase().trim() : '';

        if (!normalized) {
            this.table.dataSource = [...this.originalData];
            this.table.filteredData = [...this.originalData];
        } else {
            const keys = this.resolveKeys();
            // Split search term by spaces to handle multi-word searches
            const searchTerms = normalized.split(/\s+/).filter(term => term.length > 0);
            // Remove spaces from search term for space-agnostic matching
            const searchTermNoSpaces = normalized.replace(/\s+/g, '');

            const filtered = this.originalData.filter((row) => {
                // Get all searchable values from the row
                const searchableText = keys
                    .map((key) => this.valueToString(row?.[key]))
                    .join(' ');

                // Remove spaces from searchable text for space-agnostic matching
                const searchableTextNoSpaces = searchableText.replace(/\s+/g, '');

                // Check if all search terms are found in the searchable text sequentially (AND logic)
                const multiWordMatch = searchTerms.every((searchTerm) =>
                    searchableText.includes(searchTerm)
                );

                // Also check if search term (without spaces) matches searchable text (without spaces) sequentially
                const spaceAgnosticMatch = searchableTextNoSpaces.includes(searchTermNoSpaces);

                // Return true if any condition matches (both require sequential character matching)
                return multiWordMatch || spaceAgnosticMatch;
            });

            this.table.dataSource = filtered;
            this.table.filteredData = filtered;
        }

        if (!preservePage) {
            this.table.currentPage = 1;
        }
        this.table.calculateTotalPages();
    }

    private resolveKeys(): string[] {
        if (this.searchKeys && this.searchKeys.length) {
            return this.searchKeys;
        }

        if (Array.isArray(this.table.columns) && this.table.columns.length) {
            const candidates = this.table.columns
                .map((col: any) => col?.field)
                .filter((field: string | undefined) =>
                    typeof field === 'string' && !this.isIgnoredField(field)
                );
            if (candidates.length) {
                return candidates;
            }
        }

        if (!this.originalData.length) {
            return [];
        }
        return Object.keys(this.originalData[0]).filter((key) =>
            !this.isIgnoredField(key)
        );
    }

    private isIgnoredField(field: string): boolean {
        const normalized = field.toLowerCase();
        return normalized === 'status';
    }

    private valueToString(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).toLowerCase();
    }

}
