import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-landing">
      <img src="assets/img/homepage.jpg" alt="Welcome" class="hero-image">
    </div>
  `,
  styles: [`
    .dashboard-landing {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 150px);
      padding: 20px;
    }
    .hero-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
  `]
})
export class DashboardComponent {
  constructor(private router: Router) { }

  navigateToMFE(url: string) {
    window.open(url, '_blank');
  }
}
