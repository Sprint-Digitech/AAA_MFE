import { Component, OnInit } from '@angular/core';
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

  constructor(private router: Router) {
    console.log('Shell Booting...');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      console.log('Shell Navigated to:', url);
      // Determine if we should show the shell based on the route
      this.isLoginPage = url === '/login' || url === '/' || url === '' || url === '/register' || url.includes('forgot-password');
      this.loadUserData();
    });
  }

  ngOnInit() {
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
