import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { AccountService } from '../shared/services/account.service';
import {
  collectReportLinks,
  groupReportLinks,
  REPORT_CATEGORY_ICON,
  REPORT_CATEGORY_ORDER,
  ReportCategory,
  ReportGroup,
  ReportLink,
} from '../shared/report-catalog';

const FAVOURITES_KEY = 'fv.reportHub.favourites';
const RECENT_KEY = 'fv.reportHub.recent';
const RECENT_LIMIT = 6;

// Per-viewer conveniences only - storage may be unavailable (private window, blocked site data).
function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/**
 * Report Hub: every report the user's role grants, grouped by module, searchable, with
 * favourites and recently opened. Reads the same HRMSAuthZ menus as the sidebar, so a
 * report appears here exactly when it would appear in the menu.
 */
@Component({
  selector: 'app-report-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './report-hub.component.html',
  styleUrl: './report-hub.component.scss',
})
export class ReportHubComponent implements OnInit, OnDestroy {
  private menuSub?: Subscription;
  private allLinks: ReportLink[] = [];

  search = '';
  activeCategory: ReportCategory | 'All' = 'All';
  categories: { key: ReportCategory | 'All'; icon: string; count: number }[] = [];

  // View state is recomputed into fields on every input change - never via getters,
  // which would hand change detection a fresh array each cycle.
  groups: ReportGroup[] = [];
  favourites: ReportLink[] = [];
  recent: ReportLink[] = [];
  totalShown = 0;

  private favouritePaths = new Set<string>(readList(FAVOURITES_KEY));
  private recentPaths: string[] = readList(RECENT_KEY);

  constructor(private accountService: AccountService, private router: Router) {}

  ngOnInit(): void {
    this.setMenus(this.readStoredMenus());
    this.menuSub = this.accountService.menuData$.subscribe((menus) => {
      if (menus) this.setMenus(menus);
    });
  }

  ngOnDestroy(): void {
    this.menuSub?.unsubscribe();
  }

  private readStoredMenus(): any[] {
    try {
      return JSON.parse(sessionStorage.getItem('menus') || '[]') || [];
    } catch {
      return [];
    }
  }

  private setMenus(menus: any[]): void {
    this.allLinks = collectReportLinks(menus);
    const counts = new Map<ReportCategory, number>();
    this.allLinks.forEach((l) => counts.set(l.category, (counts.get(l.category) || 0) + 1));
    this.categories = [
      { key: 'All', icon: 'apps', count: this.allLinks.length },
      ...REPORT_CATEGORY_ORDER.filter((c) => counts.has(c)).map((c) => ({
        key: c,
        icon: REPORT_CATEGORY_ICON[c],
        count: counts.get(c) || 0,
      })),
    ];
    if (this.activeCategory !== 'All' && !counts.has(this.activeCategory)) this.activeCategory = 'All';
    this.refresh();
  }

  refresh(): void {
    const q = this.search.trim().toLowerCase();
    const matches = this.allLinks.filter(
      (l) =>
        (this.activeCategory === 'All' || l.category === this.activeCategory) &&
        (!q || l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)),
    );
    this.groups = groupReportLinks(matches);
    this.totalShown = matches.length;

    const byPath = new Map(this.allLinks.map((l) => [l.path.toLowerCase(), l]));
    this.favourites = [...this.favouritePaths].map((p) => byPath.get(p)).filter((l): l is ReportLink => !!l);
    this.recent = this.recentPaths.map((p) => byPath.get(p)).filter((l): l is ReportLink => !!l);
  }

  selectCategory(key: ReportCategory | 'All'): void {
    this.activeCategory = key;
    this.refresh();
  }

  clearSearch(): void {
    this.search = '';
    this.refresh();
  }

  isFavourite(link: ReportLink): boolean {
    return this.favouritePaths.has(link.path.toLowerCase());
  }

  toggleFavourite(link: ReportLink, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const key = link.path.toLowerCase();
    if (this.favouritePaths.has(key)) this.favouritePaths.delete(key);
    else this.favouritePaths.add(key);
    writeList(FAVOURITES_KEY, [...this.favouritePaths]);
    this.refresh();
  }

  open(link: ReportLink): void {
    const key = link.path.toLowerCase();
    this.recentPaths = [key, ...this.recentPaths.filter((p) => p !== key)].slice(0, RECENT_LIMIT);
    writeList(RECENT_KEY, this.recentPaths);
    this.router.navigateByUrl(link.path);
  }

  trackByPath(_: number, link: ReportLink): string {
    return link.path;
  }
}
