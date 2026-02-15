import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./login/login.component').then((m) => m.LoginComponent),
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./login/login.component').then((m) => m.LoginComponent),
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./registration/register-form/register-form.component').then(
                (m) => m.RegisterFormComponent
            ),
    },
    {
        path: 'welcome',
        loadComponent: () =>
            import('./registration/welcome/welcome.component').then(
                (m) => m.WelcomeComponent
            ),
    },
    {
        path: 'initial-setup',
        loadComponent: () =>
            import('./registration/initial-setup/initial-setup.component').then(
                (m) => m.InitialSetupComponent
            ),
    },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('./registration/forgot-password/forgot-password.component').then(
                (m) => m.ForgotPasswordComponent
            ),
    },
    {
        path: 'reset',
        loadComponent: () =>
            import('./registration/reset-password/reset-password.component').then(
                (m) => m.ResetPasswordComponent
            ),
    },
    {
        path: 'company',
        children: [
            { path: 'companyGroup', loadComponent: () => import('./registration/company-group/company-group.component').then(m => m.CompanyGroupComponent) },
            { path: 'updateCompanyGroup/:id', loadComponent: () => import('./registration/company-group-add/company-group-add.component').then(m => m.CompanyGroupAddComponent) },
            { path: 'list', loadComponent: () => import('./registration/companies/companies.component').then(m => m.CompaniesComponent) },
            { path: 'update/:companyId', loadComponent: () => import('./registration/add-company/add-company.component').then(m => m.AddCompanyComponent) },
            { path: 'details/:companyId', loadComponent: () => import('./registration/company-details/company-details.component').then(m => m.CompanyDetailsComponent) },
            { path: 'addBranch/:companyId', loadComponent: () => import('./registration/add-branch/add-branch.component').then(m => m.AddBranchComponent) },
            { path: 'updateBranch/:companyId/:id', loadComponent: () => import('./registration/add-branch/add-branch.component').then(m => m.AddBranchComponent) },
            { path: 'branchDetails/:companyId/:id', loadComponent: () => import('./registration/branch-details/branch-details.component').then(m => m.BranchDetailsComponent) },
            { path: 'workspace', loadComponent: () => import('./registration/workspace/workspace.component').then(m => m.WorkspaceComponent) },
            { path: 'add-existing-company', loadComponent: () => import('./registration/add-existing-company/add-existing-company.component').then(m => m.AddExistingCompanyComponent) }
        ]
    },
    {
        path: 'MenuMaster',
        children: [
            { path: 'MenuMasterList', loadComponent: () => import('./registration/menu-master/menu-master.component').then(m => m.MenuMasterComponent) },
            { path: 'addMenuMaster', loadComponent: () => import('./registration/add-menu-master/add-menu-master.component').then(m => m.AddMenuMasterComponent) },
            { path: 'updateMenuMaster/:menuID', loadComponent: () => import('./registration/add-menu-master/add-menu-master.component').then(m => m.AddMenuMasterComponent) },
            { path: 'MenuRoleMapping', loadComponent: () => import('./registration/menu-role-mapping/menu-role-mapping.component').then(m => m.MenuRoleMappingComponent) },
            { path: 'addMenuRoleMapping', loadComponent: () => import('./registration/edit-menu-role-mapping/edit-menu-role-mapping.component').then(m => m.EditMenuRoleMappingComponent) }
        ]
    },
    {
        path: 'userRolesAndPermissions',
        children: [
            { path: 'roles', loadComponent: () => import('./registration/roles/roles.component').then(m => m.RolesComponent) },
            { path: 'addRoles', loadComponent: () => import('./registration/roles-add/roles-add.component').then(m => m.RolesAddComponent) },
            { path: 'updateRoles/:roleID', loadComponent: () => import('./registration/roles-add/roles-add.component').then(m => m.RolesAddComponent) }
        ]
    },
    {
        path: 'responsibility',
        children: [
            { path: 'responsibility-list', loadComponent: () => import('./registration/responsibility-list/responsibility-list.component').then(m => m.ResponsibilityListComponent) },
            { path: 'addResponsibilityList', loadComponent: () => import('./registration/add-responsibility-list/add-responsibility-list.component').then(m => m.AddResponsibilityListComponent) },
            { path: 'updateResponsibilityList', loadComponent: () => import('./registration/add-responsibility-list/add-responsibility-list.component').then(m => m.AddResponsibilityListComponent) },
            { path: 'archResponsibilityMappingList', loadComponent: () => import('./registration/responsibility-arch-mapping-list/responsibility-arch-mapping-list.component').then(m => m.ResponsibilityArchMappingListComponent) },
            { path: 'addArchResponsibilityMappingList', loadComponent: () => import('./registration/add-responsibility-arch-mapping-list/add-responsibility-arch-mapping-list.component').then(m => m.AddResponsibilityArchMappingListComponent) },
            { path: 'updateArchResponsibilityMappingList', loadComponent: () => import('./registration/add-responsibility-arch-mapping-list/add-responsibility-arch-mapping-list.component').then(m => m.AddResponsibilityArchMappingListComponent) },
            { path: 'mappingResponsibilityList', loadComponent: () => import('./registration/responsibility-mapping-list/responsibility-mapping-list.component').then(m => m.ResponsibilityMappingListComponent) },
            { path: 'addMappingResponsibilityList', loadComponent: () => import('./registration/add-responsibility-mapping-list/add-responsibility-mapping-list.component').then(m => m.AddResponsibilityMappingListComponent) },
            { path: 'updateMappingResponsibilityList', loadComponent: () => import('./registration/add-responsibility-mapping-list/add-responsibility-mapping-list.component').then(m => m.AddResponsibilityMappingListComponent) }
        ]
    },
    {
        path: 'esiCalculationMonthLimit', loadComponent: () => import('./registration/esi-calculation-month-list/esi-calculation-month-list.component').then(m => m.EsiCalculationMonthListComponent)
    },
    {
        path: 'addEsiCalculationMonthLimit', loadComponent: () => import('./registration/add-esi-calculation-month-limit/add-esi-calculation-month-limit.component').then(m => m.AddEsiCalculationMonthLimitComponent)
    },
    {
        path: 'updateEsiCalculationMonthLimit/:id', loadComponent: () => import('./registration/add-esi-calculation-month-limit/add-esi-calculation-month-limit.component').then(m => m.AddEsiCalculationMonthLimitComponent)
    },
    {
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            if (path === 'employee') return { consumed: url };
            return null;
        },
        loadComponent: () => import('./mfe-container/mfe-container.component').then(m => m.MfeContainerComponent),
        data: { mfeUrl: 'http://localhost:4207', title: 'Employee Management' }
    },
    {
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            const salaryModules = ['bonus', 'reimbursement', 'ess', 'access', 'gratuity', 'arrear', 'salary', 'loan', 'reports', 'master', 'utility', 'attendance', 'payroll', 'settings'];
            if (salaryModules.includes(path)) return { consumed: url };
            return null;
        },
        loadComponent: () => import('./mfe-container/mfe-container.component').then(m => m.MfeContainerComponent),
        data: { mfeUrl: 'http://localhost:4206', title: 'Salary & Master Data' }
    },
    {
        matcher: (url) => {
            if (url.length === 0) return null;
            const path = url[0].path.toLowerCase();
            if (path === 'alms') return { consumed: url };
            return null;
        },
        loadComponent: () => import('./mfe-container/mfe-container.component').then(m => m.MfeContainerComponent),
        data: { mfeUrl: 'http://localhost:4205', title: 'ALMS' }
    }
];
