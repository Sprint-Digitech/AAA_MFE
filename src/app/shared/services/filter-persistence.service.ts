import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FilterPersistenceService {
    private filters: { [screen: string]: any } = {};

    setFilters(screen: string, filterValues: any) {
        this.filters[screen] = { ...filterValues };
    }

    getFilters(screen: string) {
        return this.filters[screen];
    }

    clearFilters(screen: string) {
        delete this.filters[screen];
    }
}
