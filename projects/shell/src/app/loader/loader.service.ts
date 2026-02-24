// loader.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loading = new BehaviorSubject<boolean>(false);
  private progress = new BehaviorSubject<number>(0);
  private totalRequests = 0;

  public loading$ = this.loading.asObservable();
  public progress$ = this.progress.asObservable();

  show() {
    this.totalRequests++;
    this.loading.next(true);
    if (this.totalRequests === 1) {
      this.progress.next(0);
    }
  }

  hide() {
    if (this.totalRequests > 0) {
      this.totalRequests--;
    }

    if (this.totalRequests === 0) {
      this.loading.next(false);
      this.progress.next(0);
    }
  }

  updateProgress(percent: number) {
    this.progress.next(percent);
  }

  /**
   * Reset the loader state regardless of pending requests
   * Useful for navigation or error recovery
   */
  forceHide() {
    this.totalRequests = 0;
    this.loading.next(false);
    this.progress.next(0);
  }
}
