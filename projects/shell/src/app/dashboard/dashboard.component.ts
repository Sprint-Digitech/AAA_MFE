import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="display: flex; min-height: 100vh;">
      <!-- Sidebar -->
      <div style="width: 250px; background-color: #2c3e50; color: white; padding: 20px;">
        <h3 style="margin-bottom: 30px; color: #ecf0f1;">🏢 Microfrontend Portal</h3>
        
        <!-- Authentication -->
        <div style="margin-bottom: 30px;">
          <h4 style="color: #e74c3c; margin-bottom: 15px;">� Authentication</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
              <a routerLink="/login" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                � Login
              </a>
            </li>
          </ul>
        </div>
        
        <!-- Master Menu -->
        <div style="margin-bottom: 30px;">
          <h4 style="color: #3498db; margin-bottom: 15px;">📊 Master Menu</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
              <a routerLink="/master/currency" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                � Currency
              </a>
            </li>
            <li style="margin-bottom: 10px;">
              <a routerLink="/master/department" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                🏢 Department
              </a>
            </li>
            <li style="margin-bottom: 10px;">
              <a routerLink="/master/location" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                � Location
              </a>
            </li>
            <li style="margin-bottom: 10px;">
              <a routerLink="/master/designation" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                👔 Designation
              </a>
            </li>
          </ul>
        </div>

        <!-- Employee Menu -->
        <div style="margin-bottom: 30px;">
          <h4 style="color: #e74c3c; margin-bottom: 15px;">� Employee Menu</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
              <a routerLink="/employee" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                � Employee List
              </a>
            </li>
          </ul>
        </div>

        <!-- ALMS Menu -->
        <div style="margin-bottom: 30px;">
          <h4 style="color: #f39c12; margin-bottom: 15px;">📅 ALMS Menu</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
              <a routerLink="/alms" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                📊 Attendance & Leave
              </a>
            </li>
          </ul>
        </div>

        <!-- Salary Menu -->
        <div>
          <h4 style="color: #27ae60; margin-bottom: 15px;">💰 Salary Menu</h4>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
              <a routerLink="/salary" 
                 style="color: white; text-decoration: none; padding: 8px 12px; display: block; border-radius: 4px; background-color: #34495e;">
                📄 Salary Management
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Main Content Area -->
      <div style="flex: 1; padding: 30px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #2c3e50; margin-bottom: 20px;">🏢 Welcome to Microfrontend Portal</h1>
          <p style="color: #7f8c8d; font-size: 16px; line-height: 1.6;">
            Navigate through the sidebar to access different modules. All routes are now accessible through the shell:
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px;">
            <div style="padding: 20px; border-left: 4px solid #e74c3c; background-color: #ecf0f1;">
              <h3 style="color: #2c3e50; margin-bottom: 10px;">🔐 Authentication</h3>
              <p style="color: #7f8c8d;">Login and user management</p>
              <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 3px; font-size: 12px;">http://localhost:4200/login</code>
            </div>
            
            <div style="padding: 20px; border-left: 4px solid #3498db; background-color: #ecf0f1;">
              <h3 style="color: #2c3e50; margin-bottom: 10px;">📊 Master Data</h3>
              <p style="color: #7f8c8d;">Currency, Department, Location, Designation</p>
              <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 3px; font-size: 12px;">http://localhost:4200/master/*</code>
            </div>
            
            <div style="padding: 20px; border-left: 4px solid #e74c3c; background-color: #ecf0f1;">
              <h3 style="color: #2c3e50; margin-bottom: 10px;">👥 Employee Management</h3>
              <p style="color: #7f8c8d;">View and manage employee records</p>
              <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 3px; font-size: 12px;">http://localhost:4200/employee</code>
            </div>
            
            <div style="padding: 20px; border-left: 4px solid #f39c12; background-color: #ecf0f1;">
              <h3 style="color: #2c3e50; margin-bottom: 10px;">📅 ALMS</h3>
              <p style="color: #7f8c8d;">Attendance and leave management</p>
              <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 3px; font-size: 12px;">http://localhost:4200/alms</code>
            </div>
            
            <div style="padding: 20px; border-left: 4px solid #27ae60; background-color: #ecf0f1;">
              <h3 style="color: #2c3e50; margin-bottom: 10px;">💰 Salary Management</h3>
              <p style="color: #7f8c8d;">Process salaries and compensation</p>
              <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 3px; font-size: 12px;">http://localhost:4200/salary</code>
            </div>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #d4edda; border-radius: 4px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-bottom: 10px;">🎯 Quick Access URLs</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
              <code style="color: #155724; background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 12px;">
                http://localhost:4200/login
              </code>
              <code style="color: #155724; background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 12px;">
                http://localhost:4200/master/currency
              </code>
              <code style="color: #155724; background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 12px;">
                http://localhost:4200/master/department
              </code>
              <code style="color: #155724; background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 12px;">
                http://localhost:4200/master/designation
              </code>
              <code style="color: #155724; background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 12px;">
                http://localhost:4200/employee
              </code>
              <code style="color: #155724; background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 12px;">
                http://localhost:4200/alms
              </code>
              <code style="color: #155724; background-color: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 12px;">
                http://localhost:4200/salary
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  constructor(private router: Router) { }

  navigateToMFE(url: string) {
    window.open(url, '_blank');
  }
}
