import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ActiveCompany {
  hrmsCompanyId: string;
  companyName: string;
  companyCode?: string;
  hrmsGroupId: string;
  groupName: string;
  branches: { hrmsbranchId: string; branchName: string; branchCode?: string }[];
  departmentIds?: string;
  departmentNames?: string;
  roleName: string;
  selectedBranchId?: string | null;   // null = all branches of this company
  selectedBranchName?: string | null;
}

const STORAGE_KEY = 'activeCompany';

@Injectable({ providedIn: 'root' })
export class CompanySwitcherService {
  private _active$ = new BehaviorSubject<ActiveCompany | null>(this._load());

  /** Observable of the currently-selected company. */
  readonly active$ = this._active$.asObservable();

  get active(): ActiveCompany | null {
    return this._active$.value;
  }

  switchTo(company: ActiveCompany): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(company));
    this._active$.next(company);
    this._broadcast(company);
  }

  /** Select a specific branch within the already-active company, or null for all branches. */
  switchBranch(branchId: string | null, branchName: string | null): void {
    const current = this.active;
    if (!current) return;
    const updated: ActiveCompany = { ...current, selectedBranchId: branchId, selectedBranchName: branchName };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    this._active$.next(updated);
    this._broadcast(updated);
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this._active$.next(null);
  }

  /**
   * Apply a company/branch switch received via postMessage from another frame.
   * Relays the change to this frame's own iframes without bouncing it back to the sender.
   */
  applyExternal(company: ActiveCompany): void {
    const cur = this._active$.value;
    if (cur?.hrmsCompanyId === company.hrmsCompanyId &&
        cur?.selectedBranchId === company.selectedBranchId) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(company));
    this._active$.next(company);
    const msg = { type: 'COMPANY_SWITCHED', company };
    document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
      iframe.contentWindow?.postMessage(msg, '*');
    });
  }

  private _load(): ActiveCompany | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** Notify all MFE iframes about the company change. */
  private _broadcast(company: ActiveCompany): void {
    const msg = { type: 'COMPANY_SWITCHED', company };
    document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
      iframe.contentWindow?.postMessage(msg, '*');
    });
    if (window !== window.parent) {
      window.parent.postMessage(msg, '*');
    }
  }
}
