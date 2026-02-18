import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoginPage = true;
  isSidebarCollapsed = false;
  user: any = null;
  menus: any[] = [];
  currentUrl: string = '';

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    console.log('Shell Booting...');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateState((event.urlAfterRedirects || event.url));
    });
  }

  isRouteActive(routePath: string): boolean {
    return this.currentUrl.toLowerCase().startsWith(routePath.toLowerCase());
  }

  ngOnInit() {
    this.updateState(this.router.url);
  }

  updateState(rawUrl: string) {
    // Strip query params for cleaner matching on routes
    this.currentUrl = rawUrl.split('?')[0];
    const url = this.currentUrl.toLowerCase();

    console.log('Shell: Current URL path:', url);

    // Improved detection: check for common login/register paths
    // We also check for 'gateway/dist/login' just in case the router state includes the full path
    this.isLoginPage =
      url === '/login' ||
      url === '/' ||
      url === '' ||
      url === '/register' ||
      url.includes('forgot-password') ||
      url.includes('reset') ||
      url.includes('/login') ||
      url.endsWith('/login') ||
      url.includes('initial-setup') ||
      url.includes('welcome') ||
      url.includes('company') ||
      url.includes('MenuMaster') ||
      url.includes('userRolesAndPermissions') ||
      url.includes('responsibility') ||
      url.includes('esiCalculationMonthLimit');

    console.log('Shell: isLoginPage set to:', this.isLoginPage);

    this.loadUserData();
    this.cdr.detectChanges();
  }

  loadUserData() {
    try {
      const storedUser = sessionStorage.getItem('user');
      const storedMenus = sessionStorage.getItem('menus');
      if (storedUser && storedUser !== 'undefined') this.user = JSON.parse(storedUser);
      if (storedMenus && storedMenus !== 'undefined') {
        this.menus = JSON.parse(storedMenus);
        console.log('Shell Loaded Menus:', this.menus);
      }
    } catch (e) {
      console.warn('Session data parse error', e);
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
