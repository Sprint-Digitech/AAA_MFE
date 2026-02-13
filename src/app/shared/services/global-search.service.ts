import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalSearchService {
  private searchSubject = new BehaviorSubject<string>('');
  private consumers = new Set<(term: string) => void>();

  readonly search$ = this.searchSubject.asObservable();

  emit(term: string): void {
    this.searchSubject.next(term);
    this.consumers.forEach((consumer) => consumer(term));
  }

  registerConsumer(consumer: (term: string) => void): () => void {
    this.consumers.add(consumer);
    consumer(this.searchSubject.getValue());
    return () => {
      this.consumers.delete(consumer);
    };
  }

  get currentTerm(): string {
    return this.searchSubject.getValue();
  }
}

