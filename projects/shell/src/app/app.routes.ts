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
        path: 'register',
        component: LoginContainerComponent
    },
    {
        path: 'welcome',
        component: LoginContainerComponent
    },
    {
        path: 'initial-setup',
        component: LoginContainerComponent
    },
    {
        path: 'forgot-password',
        component: LoginContainerComponent
    },
    {
        path: 'reset',
        component: LoginContainerComponent
    },
    {
        path: 'company',
        component: LoginContainerComponent
    },
    {
        path: 'MenuMaster',
        component: LoginContainerComponent
    },
    {
        path: 'userRolesAndPermissions',
        component: LoginContainerComponent
    },
    {
        path: 'responsibility',
        component: LoginContainerComponent
    },
    {
        path: 'esiCalculationMonthLimit',
        component: LoginContainerComponent
    },
    {
        path: 'addEsiCalculationMonthLimit',
        component: LoginContainerComponent
    },
    {
        path: 'updateEsiCalculationMonthLimit',
        component: LoginContainerComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent
    },
    {
        // Salary & Master Data MFE
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            const subPath = url.length > 1 ? url[1].path.toLowerCase() : '';

            // Paths that must go to Salary MFE
            const salaryModules = [
                'bonus', 'reimbursement', 'access', 'gratuity', 'arrear',
                'salary', 'loan', 'reports', 'master', 'utility',
                'payroll', 'settings', 'currency', 'department', 'location', 'designation'
            ];

            if (salaryModules.includes(path)) return { consumed: url };

            // Specific sub-paths for Salary
            if (path === 'employee') {
                const salaryEmployeeSubPaths = [
                    'employeeannualbonus', 'employeectc', 'addemployeectc',
                    'updateemployeectc', 'employeectcdetails', 'ctcemployee'
                ];
                if (salaryEmployeeSubPaths.includes(subPath)) return { consumed: url };
            }

            if (path === 'attendance') {
                const salaryAttendanceSubPaths = ['holiday-master', 'add-holiday', 'edit-holiday', 'bulk-upload-holiday'];
                if (salaryAttendanceSubPaths.includes(subPath)) return { consumed: url };
            }

            if (path === 'employeeselfservice' && subPath === 'salary&tax') return { consumed: url };

            // Handle legacy 'ess' link if it maps to Salary
            if (path === 'ess') return { consumed: url };

            return null;
        },
        component: MfeContainerComponent,
        data: { mfeUrl: 'https://dev.fovestta.com/Salary/dist/', title: 'Salary & Master Data' }
    },
    {
        // ALMS & ESS MFE
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            const subPath = url.length > 1 ? url[1].path.toLowerCase() : '';

            // ALMS handles 'alms', most 'attendance', and most 'employeeselfservice'
            if (path === 'alms' || path === 'attendance' || path === 'employeeselfservice') return { consumed: url };

            // Specific employee routes for ALMS (Attendance)
            const almsEmployeeSubPaths = ['employeeattendance', 'addemployeeattendancebysheet', 'employeebiometric'];
            if (path === 'employee' && almsEmployeeSubPaths.includes(subPath)) return { consumed: url };

            return null;
        },
        component: MfeContainerComponent,
        data: { mfeUrl: 'https://dev.fovestta.com/ALMS/dist/', title: 'ALMS & ESS' }
    },
    {
        // Employee Management MFE
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            // Remaining 'employee' routes go to Employee MFE
            if (path === 'employee') return { consumed: url };
            return null;
        },
        component: MfeContainerComponent,
        data: { mfeUrl: 'https://dev.fovestta.com/Employee/dist/', title: 'Employee Management' }
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
