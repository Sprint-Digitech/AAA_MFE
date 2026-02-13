import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntityRefreshService {
  private refreshSubjects: Map<string, Subject<void>> = new Map();

  /**
   * Get refresh observable for a specific entity type
   */
  getRefresh$(entityType: string): Observable<void> {
    if (!this.refreshSubjects.has(entityType)) {
      this.refreshSubjects.set(entityType, new Subject<void>());
    }
    return this.refreshSubjects.get(entityType)!.asObservable();
  }

  /**
   * Trigger refresh for a specific entity type
   */
  triggerRefresh(entityType: string): void {
    if (!this.refreshSubjects.has(entityType)) {
      this.refreshSubjects.set(entityType, new Subject<void>());
    }
    this.refreshSubjects.get(entityType)!.next();
  }
}

