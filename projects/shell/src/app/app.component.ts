import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { GlobalSearchService } from './shared/services/global-search.service';
import { LoaderComponent } from './loader/loader/loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule, FormsModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoginPage = true;
  isSidebarCollapsed = false;
  user: any = null;
  menus: any[] = [];
  currentUrl: string = '';
  globalSearchTerm: string = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private globalSearchService: GlobalSearchService
  ) {
    console.log('Shell Booting...');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateState((event.urlAfterRedirects || event.url));
      this.globalSearchTerm = '';
      this.globalSearchService.emit('');
    });
  }

  isRouteActive(routePath: string): boolean {
    return this.currentUrl.toLowerCase().startsWith(routePath.toLowerCase());
  }

  ngOnInit() {
    this.updateState(this.router.url);

    // Listen for messages from MFEs (e.g. for logout or navigation)
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'LOGOUT') {
        this.logout(false);
      }
      if (event.data && event.data.type === 'ROUTER_NAVIGATED') {
        if (window.location.pathname !== event.data.url) {
          // Update the parent browser URL to match the iframe's navigation exactly without reloading
          window.history.replaceState(null, '', event.data.url);
        }
      }
    });
  }

  updateState(rawUrl: string) {
    // Strip query params for cleaner matching on routes
    this.currentUrl = rawUrl.split('?')[0];
    const url = this.currentUrl.toLowerCase();

    console.log('Shell: Current URL path:', url);

    // Improved detection: check for common login/register paths
    // A page is a login page (no shell) if it's explicitly /login, /register, or forgot/reset.
    // 'welcome' and others have been removed because they should show the shell.
    this.isLoginPage =
      url === '/login' ||
      url === '/' ||
      url === '' ||
      url === '/register' ||
      url === '/authentication/login' ||
      url.includes('forgot-password') ||
      url.includes('reset') ||
      url.includes('/employee') ||
      url.includes('/salary') ||
      url.includes('/alms') ||
      url.includes('/notification');

    console.log('Shell: isLoginPage set to:', this.isLoginPage);

    this.loadUserData();
    this.cdr.detectChanges();
  }

  logout(propagate: boolean = true) {
    console.log('Shell: Logging out...');

    if (propagate) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.contentWindow?.postMessage({ type: 'LOGOUT' }, '*');
      });
    }

    sessionStorage.clear();
    this.user = null;
    this.menus = [];
    this.router.navigate(['/login']);
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

  onSearchInput(value: string) {
    this.globalSearchTerm = value;
    this.globalSearchService.emit(value.trim());
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
