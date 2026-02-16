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
      // Strip query params for cleaner matching on routes
      this.currentUrl = (event.urlAfterRedirects || event.url).split('?')[0];
      const url = this.currentUrl;
      console.log('Shell Navigated to (base):', url);
      // Determine if we should show the shell based on the route
      this.isLoginPage = url === '/login' || url === '/' || url === '' || url === '/register' || url.includes('forgot-password');
      this.loadUserData();
      this.cdr.detectChanges();
    });
  }

  isRouteActive(routePath: string): boolean {
    return this.currentUrl.toLowerCase().startsWith(routePath.toLowerCase());
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.loadUserData();
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
