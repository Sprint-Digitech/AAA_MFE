import { AfterViewInit, ComponentRef, Directive, ElementRef, OnDestroy, Optional, ViewContainerRef } from '@angular/core';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
import { GlobalTableSearchDirective } from './global-table-search.directive';
import { AdvancedFilterBarComponent } from '../components/advanced-table-filter/advanced-filter-bar.component';

@Directive({
    selector: '[appAdvancedTableFilter]',
    standalone: true,
})
export class AdvancedTableFilterDirective implements AfterViewInit, OnDestroy {
    private componentRef?: ComponentRef<AdvancedFilterBarComponent>;

    constructor(
        private table: NemoReusableTblComponent,
        private elementRef: ElementRef<HTMLElement>,
        private viewContainerRef: ViewContainerRef,
        @Optional() private searchDirective: GlobalTableSearchDirective | null
    ) { }

    ngAfterViewInit(): void {
        this.componentRef = this.viewContainerRef.createComponent(AdvancedFilterBarComponent);
        this.componentRef.instance.table = this.table;
        this.componentRef.instance.searchDirective = this.searchDirective;

        const hostElement = this.elementRef.nativeElement;
        const filterElement = this.componentRef.location.nativeElement as HTMLElement;

        // Place the advanced filter bar inside the table's header (next to "Filter by
        // Branch", before the Add button) instead of above the whole table.
        const headerRight = hostElement.querySelector('.header-right');
        if (headerRight) {
            headerRight.insertBefore(filterElement, headerRight.firstChild);
        } else {
            hostElement.parentNode?.insertBefore(filterElement, hostElement);
        }
    }

    ngOnDestroy(): void {
        this.componentRef?.destroy();
    }
}
