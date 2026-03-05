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
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            const authMfePaths = [
                'welcome', 'initial-setup', 'forgot-password', 'reset',
                'company', 'menumaster', 'userrolesandpermissions',
                'responsibility', 'esicalculationmonthlimit',
                'addesicalculationmonthlimit', 'updateesicalculationmonthlimit'
            ];
            if (authMfePaths.includes(path)) {
                return { consumed: [url[0]] };
            }
            return null;
        },
        children: [
            {
                path: '**',
                component: LoginContainerComponent
            }
        ]
    },
    {
        path: 'dashboard',
        redirectTo: 'initial-setup',
        pathMatch: 'full'
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
                'payroll', 'settings', 'currency', 'department', 'location',
                'designation', 'welcome-user', 'home', 'tracing', 'tax',
                'tds', 'perquisites', 'investment'
            ];

            if (salaryModules.includes(path)) return { consumed: [url[0]] };

            // Specific sub-paths for Salary
            if (path === 'employee') {
                const salaryEmployeeSubPaths = [
                    'employeeannualbonus', 'employeectc', 'addemployeectc',
                    'updateemployeectc', 'employeectcdetails', 'ctcemployee',
                    'employeetdslist', 'employeevpf', 'addemployeevpf', 'updateemployeevpf',
                    'employeepf', 'addemployeepf', 'updateemployeepf',
                    'addemployeectcdetails', 'updateemployeectcdetails', 'appraisel-letter',
                    'employeeattendance', 'addemployeeattendancebysheet'
                ];
                if (salaryEmployeeSubPaths.includes(subPath)) return { consumed: [url[0], url[1]] };
            }

            if (path === 'attendance') {
                const salaryAttendanceSubPaths = ['holiday-master', 'add-holiday', 'edit-holiday', 'bulk-upload-holiday'];
                if (salaryAttendanceSubPaths.includes(subPath)) return { consumed: [url[0], url[1]] };
            }

            if (path === 'employeeselfservice' && subPath === 'salary&tax') return { consumed: [url[0], url[1]] };
            if (path === 'employeeselfservice' && subPath === 'tds') return { consumed: [url[0], url[1]] };

            // Handle legacy 'ess' link if it maps to Salary
            if (path === 'ess') return { consumed: [url[0]] };

            return null;
        },
        children: [
            {
                path: '**',
                component: MfeContainerComponent
            }
        ]
    },
    {
        // ALMS & ESS MFE
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            const subPath = url.length > 1 ? url[1].path.toLowerCase() : '';

            // ALMS handles 'alms', most 'attendance', and most 'employeeselfservice'
            if (path === 'alms' || path === 'attendance' || path === 'employeeselfservice') return { consumed: [url[0]] };

            // Specific employee routes for ALMS (Attendance)
            const almsEmployeeSubPaths = ['employeebiometric'];
            if (path === 'employee' && almsEmployeeSubPaths.includes(subPath)) return { consumed: [url[0], url[1]] };

            return null;
        },
        children: [
            {
                path: '**',
                component: MfeContainerComponent
            }
        ]
    },
    {
        // Employee Management MFE
        path: 'employee',
        children: [
            {
                path: '**',
                component: MfeContainerComponent
            }
        ]
    },
    {
        // Notification MFE
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            if (path === 'notification') return { consumed: [url[0]] };
            return null;
        },
        children: [
            {
                path: '**',
                component: MfeContainerComponent
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
