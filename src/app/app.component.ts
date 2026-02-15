import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'login';
  isLoginPage = true;
  isExpanded = true;
  isSidebarCollapsed = false; // Add compatibility for my existing toggle if needed
  openSubmenus: Set<string> = new Set();
  menus: any[] = [];
  user: any = null;
  currentSubmenuTop = 0;

  menuIcons: { [key: string]: string } = {
    Employee: 'badge',
    Reports: 'add_chart',
    Settings: 'settings',
    Loan: 'account_balance_wallet',
    Loans: 'account_balance_wallet',
    Salary: 'currency_rupee',
    Reimbursement: 'savings',
    ALMS: 'calendar_month',
    Bonus: 'emoji_events',
    Master: 'grid_view',
    'ESS Portal': 'man_4',
    Gratuity: 'work_history',
    Arrear: 'history',
    Dashboard: 'dashboard'
  };

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      console.log('AppComponent: URL Changed to', url);
      this.isLoginPage = url === '/login' || url === '/' || url === '' || url === '/register' || url.includes('forgot-password');
      console.log('AppComponent: isLoginPage =', this.isLoginPage);
      this.loadUserData();
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const storedMenus = sessionStorage.getItem('menus');
    const storedUser = sessionStorage.getItem('user');
    if (storedMenus) {
      this.menus = JSON.parse(storedMenus);
    }
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    this.isSidebarCollapsed = !this.isExpanded;
    if (!this.isExpanded) {
      this.openSubmenus.clear();
    }
  }

  onMenuClick(event: Event, menu: any) {
    event.stopPropagation();
    if (!this.isExpanded) {
      this.isExpanded = true;
      this.isSidebarCollapsed = false;
    }

    if (menu.submenu && menu.submenu.length > 0) {
      event.preventDefault();
      const menuId = menu.menuDisplayName;

      const wasOpen = this.isSubmenuOpen(menuId);
      this.openSubmenus.clear();
      if (!wasOpen) {
        this.openSubmenus.add(menuId);

        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        // Use direct property binding (subtracting 12px for internal padding alignment)
        this.currentSubmenuTop = rect.top - 12;
      }
    } else {
      this.openSubmenus.clear();
    }
  }

  closeSubmenus() {
    this.openSubmenus.clear();
  }

  // Close submenu on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-item') && !target.closest('.submenu')) {
      this.openSubmenus.clear();
    }
  }

  isSubmenuOpen(menuId: string): boolean {
    return this.openSubmenus.has(menuId);
  }

  hasSubmenu(menu: any): boolean {
    return menu.submenu && menu.submenu.length > 0;
  }

  getIcon(menuName: string): string {
    return this.menuIcons[menuName] || 'list';
  }
}
