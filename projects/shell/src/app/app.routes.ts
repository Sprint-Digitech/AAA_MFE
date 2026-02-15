import { Routes } from '@angular/router';
import { LoginContainerComponent } from './login-container/login-container.component';
import { MfeContainerComponent } from './mfe-container/mfe-container.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginContainerComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent
    },
    {
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            const salaryModules = [
                'bonus', 'reimbursement', 'ess', 'access', 'gratuity', 'arrear',
                'salary', 'loan', 'reports', 'master', 'utility', 'attendance',
                'payroll', 'settings', 'currency', 'department', 'location', 'designation'
            ];
            if (salaryModules.includes(path)) return { consumed: url };
            return null;
        },
        component: MfeContainerComponent,
        data: { mfeUrl: 'http://localhost:4206', title: 'Salary & Master Data' }
    },
    {
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            if (path === 'employee') return { consumed: url };
            return null;
        },
        component: MfeContainerComponent,
        data: { mfeUrl: 'http://localhost:4207', title: 'Employee Management' }
    },
    {
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            if (path === 'alms') return { consumed: url };
            return null;
        },
        component: MfeContainerComponent,
        data: { mfeUrl: 'http://localhost:4205', title: 'ALMS' }
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
