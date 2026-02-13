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
        path: 'company/companyGroup',
        loadComponent: () =>
            import('./registration/company-group/company-group.component').then(
                (m) => m.CompanyGroupComponent
            ),
    },
    {
        path: 'company/updateCompanyGroup/:id',
        loadComponent: () =>
            import('./registration/company-group-add/company-group-add.component').then(
                (m) => m.CompanyGroupAddComponent
            ),
    },
    {
        path: 'company/list',
        loadComponent: () =>
            import('./registration/companies/companies.component').then(
                (m) => m.CompaniesComponent
            ),
    },
    {
        path: 'company/update/:companyId',
        loadComponent: () =>
            import('./registration/add-company/add-company.component').then(
                (m) => m.AddCompanyComponent
            ),
    },
    {
        path: 'company/details/:companyId',
        loadComponent: () =>
            import('./registration/company-details/company-details.component').then(
                (m) => m.CompanyDetailsComponent
            ),
    },
    {
        path: 'company/addBranch/:companyId',
        loadComponent: () =>
            import('./registration/add-branch/add-branch.component').then(
                (m) => m.AddBranchComponent
            ),
    },
    {
        path: 'company/updateBranch/:companyId/:id',
        loadComponent: () =>
            import('./registration/add-branch/add-branch.component').then(
                (m) => m.AddBranchComponent
            ),
    },
    {
        path: 'company/branchDetails/:companyId/:id',
        loadComponent: () =>
            import('./registration/branch-details/branch-details.component').then(
                (m) => m.BranchDetailsComponent
            ),
    },
    {
        path: 'company/workspace',
        loadComponent: () =>
            import('./registration/workspace/workspace.component').then(
                (m) => m.WorkspaceComponent
            ),
    },
    {
        path: 'company/add-existing-company',
        loadComponent: () =>
            import(
                './registration/add-existing-company/add-existing-company.component'
            ).then((m) => m.AddExistingCompanyComponent),
    },
    {
        path: 'MenuMaster/MenuMasterList',
        loadComponent: () =>
            import('./registration/menu-master/menu-master.component').then(
                (m) => m.MenuMasterComponent
            ),
    },
    {
        path: 'MenuMaster/addMenuMaster',
        loadComponent: () =>
            import('./registration/add-menu-master/add-menu-master.component').then(
                (m) => m.AddMenuMasterComponent
            ),
    },
    {
        path: 'MenuMaster/updateMenuMaster/:menuID',
        loadComponent: () =>
            import('./registration/add-menu-master/add-menu-master.component').then(
                (m) => m.AddMenuMasterComponent
            ),
    },
    {
        path: 'MenuMaster/MenuRoleMapping',
        loadComponent: () =>
            import('./registration/menu-role-mapping/menu-role-mapping.component').then(
                (m) => m.MenuRoleMappingComponent
            ),
    },
    {
        path: 'MenuMaster/addMenuRoleMapping',
        loadComponent: () =>
            import(
                './registration/edit-menu-role-mapping/edit-menu-role-mapping.component'
            ).then((m) => m.EditMenuRoleMappingComponent),
    },
    {
        path: 'userRolesAndPermissions/roles',
        loadComponent: () =>
            import('./registration/roles/roles.component').then(
                (m) => m.RolesComponent
            ),
    },
    {
        path: 'userRolesAndPermissions/addRoles',
        loadComponent: () =>
            import('./registration/roles-add/roles-add.component').then(
                (m) => m.RolesAddComponent
            ),
    },
    {
        path: 'userRolesAndPermissions/updateRoles/:roleID',
        loadComponent: () =>
            import('./registration/roles-add/roles-add.component').then(
                (m) => m.RolesAddComponent
            ),
    },
    {
        path: 'responsibility/responsibility-list',
        loadComponent: () =>
            import(
                './registration/responsibility-list/responsibility-list.component'
            ).then((m) => m.ResponsibilityListComponent),
    },
    {
        path: 'responsibility/addResponsibilityList',
        loadComponent: () =>
            import(
                './registration/add-responsibility-list/add-responsibility-list.component'
            ).then((m) => m.AddResponsibilityListComponent),
    },
    {
        path: 'responsibility/updateResponsibilityList',
        loadComponent: () =>
            import(
                './registration/add-responsibility-list/add-responsibility-list.component'
            ).then((m) => m.AddResponsibilityListComponent),
    },
    {
        path: 'responsibility/archResponsibilityMappingList',
        loadComponent: () =>
            import(
                './registration/responsibility-arch-mapping-list/responsibility-arch-mapping-list.component'
            ).then((m) => m.ResponsibilityArchMappingListComponent),
    },
    {
        path: 'responsibility/addArchResponsibilityMappingList',
        loadComponent: () =>
            import(
                './registration/add-responsibility-arch-mapping-list/add-responsibility-arch-mapping-list.component'
            ).then((m) => m.AddResponsibilityArchMappingListComponent),
    },
    {
        path: 'responsibility/updateArchResponsibilityMappingList',
        loadComponent: () =>
            import(
                './registration/add-responsibility-arch-mapping-list/add-responsibility-arch-mapping-list.component'
            ).then((m) => m.AddResponsibilityArchMappingListComponent),
    },
    {
        path: 'responsibility/mappingResponsibilityList',
        loadComponent: () =>
            import(
                './registration/responsibility-mapping-list/responsibility-mapping-list.component'
            ).then((m) => m.ResponsibilityMappingListComponent),
    },
    {
        path: 'responsibility/addMappingResponsibilityList',
        loadComponent: () =>
            import(
                './registration/add-responsibility-mapping-list/add-responsibility-mapping-list.component'
            ).then((m) => m.AddResponsibilityMappingListComponent),
    },
    {
        path: 'responsibility/updateMappingResponsibilityList',
        loadComponent: () =>
            import(
                './registration/add-responsibility-mapping-list/add-responsibility-mapping-list.component'
            ).then((m) => m.AddResponsibilityMappingListComponent),
    },
    {
        path: 'esiCalculationMonthLimit',
        loadComponent: () =>
            import(
                './registration/esi-calculation-month-list/esi-calculation-month-list.component'
            ).then((m) => m.EsiCalculationMonthListComponent),
    },
    {
        path: 'addEsiCalculationMonthLimit',
        loadComponent: () =>
            import(
                './registration/add-esi-calculation-month-limit/add-esi-calculation-month-limit.component'
            ).then((m) => m.AddEsiCalculationMonthLimitComponent),
    },
    {
        path: 'updateEsiCalculationMonthLimit/:id',
        loadComponent: () =>
            import(
                './registration/add-esi-calculation-month-limit/add-esi-calculation-month-limit.component'
            ).then((m) => m.AddEsiCalculationMonthLimitComponent),
    },
    {
        path: 'branch-probation-setting',
        loadComponent: () =>
            import(
                './registration/branch-probation-settings-list/branch-probation-settings-list.component'
            ).then((m) => m.BranchProbationSettingsListComponent),
    },
    {
        path: 'add-branch-probation-setting',
        loadComponent: () =>
            import(
                './registration/add-branch-probation-settings/add-branch-probation-settings.component'
            ).then((m) => m.AddBranchProbationSettingsComponent),
    },
    {
        path: 'update-branch-probation-setting/:branchProbationSettingId',
        loadComponent: () =>
            import(
                './registration/add-branch-probation-settings/add-branch-probation-settings.component'
            ).then((m) => m.AddBranchProbationSettingsComponent),
    },
];
