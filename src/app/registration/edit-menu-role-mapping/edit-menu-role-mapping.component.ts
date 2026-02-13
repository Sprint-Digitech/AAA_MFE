import { Component } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface MenuItem {
  menuID: string;
  menuName: string;
  menuDisplayName: string;
  menuPath: string;
  remarks: string;
  menuParentId: string | null;
  menuParent: any;
  status: number;
  children?: MenuItem[]; // Add this property for nested structure
  level?: number; // Add this for dropdown levels
}
@Component({
  selector: 'app-edit-menu-role-mapping',
  imports: [AddUpdateFormComponent, MatCheckboxModule, CommonModule],
  templateUrl: './edit-menu-role-mapping.component.html',
  styleUrls: ['./edit-menu-role-mapping.component.scss'],
})
export class EditMenuRoleMappingComponent {
  addRolemenuForm!: FormGroup;
  menuList: any[] = [];
  menuListRole: any[] = [];
  activRoleList: any[] = [];
  menuRoleMappingId: string = '';
  roleList: any = [];
  targetData: any;
  roleID: any;
  // selectedMenuIds:any;
  menuListMaster: any;
  flatMenuList: any;
  selectedMenuIds: any[] = [];
  groupedMenuCategories: any[] = [];
  editRoleFormLoaded = false;
  isEditMode = false;
  mapRolesFormConfig: FormConfig = {
    formTitle: 'Map Roles',
    maxColsPerRow: 5,
    sections: [
      {
        fields: [
          {
            name: 'roleName',
            label: 'Role Name',
            type: 'text',
            maxLength: 50,
            colSpan: 1,
            value: '',
            disabled: true,
            validations: [
              { type: 'maxLength', value: 50, message: 'Max 50 characters' },
            ],
          },
        ],
      },
    ],
    submitLabel: 'Save',
    resetLabel: 'Reset',
    cancelLabel: 'Back',
    onSubmit: (data) => this.sendData(data),
    onCancel: () => this.goBack(),
  };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationService,
    private service: AccountService,
    private location: Location,
  ) {}

  ngOnInit() {
    this.addRolemenuForm = this.fb.group({
      RoleID: ['', Validators.required],
      roleName: [''],
      MenuID: [''],
      menuDropdown: [''], // Dropdown control

      menuList: this.fb.array([]),
    });

    // Check if we're in edit mode (roleID in route) or add mode
    this.route.params.subscribe((params) => {
      this.roleID = params['roleID'];
      this.isEditMode = !!this.roleID;

      // Load menu master list first, then load role data or menus for add mode
      this.getMenuMasterList();
    });

    this.getAllRoleList();
  }

  getMenuMasterList() {
    this.service.get('api/Roles/GetMenuMaster').subscribe((data: any) => {
      // Initialize grouped data arrays
      this.menuListMaster = [];
      this.flatMenuList = [];

      // Filter out inactive menus
      const activeMenus = data.filter((menu: any) => menu.status !== 0);

      // Create a map for quick lookup of menu items by ID
      const menuMap = new Map<string, MenuItem>();
      activeMenus.forEach((menu: MenuItem) => {
        menu.children = [];
        menuMap.set(menu.menuID, menu);
      });

      // Separate parent and child menus
      const parentMenus = activeMenus.filter(
        (item: MenuItem) => item.menuParentId === null,
      );
      const childMenus = activeMenus.filter(
        (item: MenuItem) => item.menuParentId !== null,
      );

      // Group child menus by their parent ID
      const groupedByParent = childMenus.reduce((acc: any, curr: MenuItem) => {
        if (!acc[curr.menuParentId!]) {
          acc[curr.menuParentId!] = [];
        }
        acc[curr.menuParentId!].push(curr);
        return acc;
      }, {});

      // Build hierarchical structure
      parentMenus.forEach((parent: MenuItem) => {
        // Add children to parent if they exist
        if (groupedByParent[parent.menuID]) {
          parent.children = groupedByParent[parent.menuID];
        }
        this.menuListMaster.push(parent);
      });

      // Create flattened list for dropdown with hierarchy levels
      this.menuListMaster.forEach((parent: MenuItem) => {
        // Add parent menu with level 0
        this.flatMenuList.push({
          ...parent,
          level: 0,
          menuDisplayName: parent.menuDisplayName,
        });

        // Add child menus with level 1
        if (parent.children && parent.children.length > 0) {
          parent.children.forEach((child: MenuItem) => {
            this.flatMenuList.push({
              ...child,
              level: 1,
              menuDisplayName: child.menuDisplayName,
            });
          });
        }
      });

      // After menuListMaster is populated, load role data or menus for add mode
      if (this.isEditMode) {
        this.getData();
      } else {
        // Add mode: initialize form config with role dropdown
        this.initializeFormConfig();
        this.loadAllMenusForAdd();
      }
    });
  }

  getMenuList() {
    this.service.get('api/Roles/Getmenumapping').subscribe((data: any) => {
      // Remove duplicates based on menuID (use a Map to ensure uniqueness)
      const uniqueMenus = Array.from(
        new Map(
          data.map((menu: any) => [menu.menuMaster?.menuID, menu]),
        ).values(),
      );

      // Get selected MenuIDs from the form
      const selectedMenuIds = this.addRolemenuForm.value.MenuID || [];

      // Map through the unique fetched menu list and add access status
      this.menuList = uniqueMenus.map((menu: any) => ({
        ...menu,
        access: selectedMenuIds.includes(menu.menuMaster?.menuID), // Set access based on form's MenuID values
      }));
    });
  }

  getData() {
    if (this.roleID) {
      this.service
        .get(`api/Roles/Getmenumapping?roleId=${this.roleID}`)
        .subscribe((data: any) => {
          if (data && data[0]?.roleMaster) {
            this.addRolemenuForm.patchValue({
              RoleID: data[0].roleMaster?.roleID,
              roleName: data[0].roleMaster?.roleName,
            });

            // Update form config with role name
            if (
              this.mapRolesFormConfig.sections &&
              this.mapRolesFormConfig.sections[0]?.fields
            ) {
              this.mapRolesFormConfig.sections[0].fields[0].value =
                data[0].roleMaster?.roleName || '';
            }

            this.editRoleFormLoaded = true;

            // Get list of already mapped menu IDs
            this.selectedMenuIds =
              data[0].roleMaster?.menuRoleMappings.map((m: any) => m.menuID) ||
              [];
            if (!Array.isArray(this.selectedMenuIds)) {
              this.selectedMenuIds = [];
            }

            // Create a map of existing mappings with their menuRoleMappingId
            const existingMappings = new Map();
            data[0].roleMaster?.menuRoleMappings.forEach((mapping: any) => {
              existingMappings.set(mapping.menuID, mapping.menuRoleMappingId);
            });

            // Load ALL menus from menuListMaster (like in add mode) but mark mapped ones as checked
            this.loadAllMenusForEdit(existingMappings);
          } else {
          }
        });
    }
  }

  loadAllMenusForEdit(existingMappings: Map<string, string>) {
    // For edit mode, load all menus from menuListMaster and mark mapped ones as checked
    if (!this.menuListMaster || this.menuListMaster.length === 0) {
      return;
    }

    this.menuListRole = [];

    // Add all menus (parents and children) with access based on existing mappings
    this.menuListMaster.forEach((parent: any) => {
      const parentAccess = this.selectedMenuIds.includes(parent.menuID);
      // Add parent menu
      this.menuListRole.push({
        menuID: parent.menuID,
        menuName: parent.menuName,
        menuDisplayName: parent.menuDisplayName || parent.menuName,
        menuParentId: parent.menuParentId,
        access: parentAccess,
        isParent: true,
        isBold: true,
        menuRoleMappingId: existingMappings.get(parent.menuID) || null,
      });

      // Add child menus
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach((child: any) => {
          const childAccess = this.selectedMenuIds.includes(child.menuID);
          this.menuListRole.push({
            menuID: child.menuID,
            menuName: child.menuName,
            menuDisplayName: child.menuDisplayName || child.menuName,
            menuParentId: child.menuParentId,
            access: childAccess,
            isParent: false,
            menuRoleMappingId: existingMappings.get(child.menuID) || null,
          });
        });
      }
    });

    this.groupMenusByCategory();
  }

  groupMenusByCategory() {
    // Get all parent menus (categories) from menuListMaster
    if (!this.menuListMaster || this.menuListMaster.length === 0) {
      return;
    }

    // Define the order of categories
    const categoryOrder = [
      'Master',
      'Settings',
      'Reports',
      'ALMS',
      'Employee',
      'Salary',
      'Loan',
      'Bonus',
      'Reimbursement',
      'ESS',
      'Access Rights',
      'Gratuity',
      'Arrear',
    ];

    this.groupedMenuCategories = this.menuListMaster
      .map((parent: any) => {
        // Get all child menus for this parent from menuListRole (only child menus, not parent)
        const childMenus = this.menuListRole.filter(
          (menu: any) => menu.menuParentId === parent.menuID,
        );

        return {
          categoryName: parent.menuDisplayName || parent.menuName,
          categoryId: parent.menuID,
          menus: childMenus, // Only include child menus, not parent
        };
      })
      .filter((category: any) => category.menus.length > 0)
      .sort((a: any, b: any) => {
        const indexA = categoryOrder.findIndex(
          (order) => order.toLowerCase() === a.categoryName.toLowerCase(),
        );
        const indexB = categoryOrder.findIndex(
          (order) => order.toLowerCase() === b.categoryName.toLowerCase(),
        );

        // If both categories are in the order array, sort by their index
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If only A is in the order array, A comes first
        if (indexA !== -1) {
          return -1;
        }
        // If only B is in the order array, B comes first
        if (indexB !== -1) {
          return 1;
        }
        // If neither is in the order array, maintain original order
        return 0;
      });
  }

  // Function to add selected menu to the table

  // Function to add selected menu to the table
  // Function to add selected menu to the table
  addMenuToTable() {
    const selectedMenuId = this.addRolemenuForm.get('menuDropdown')?.value;
    if (!selectedMenuId) return;

    // Find the selected menu from the FLAT list
    const selectedMenu = this.flatMenuList.find(
      (menu: any) => menu.menuID === selectedMenuId,
    );

    if (!selectedMenu) return;

    // Check if it's a parent menu (level 0 or no menuParentId)
    const isParentMenu = selectedMenu.level === 0 || !selectedMenu.menuParentId;

    if (isParentMenu) {
      // PARENT MENU SELECTED - Add parent + all children

      // Add parent menu first (if not already added)
      if (
        !this.menuListRole.some((menu) => menu.menuID === selectedMenu.menuID)
      ) {
        this.menuListRole.push({
          menuID: selectedMenu.menuID,
          menuName: selectedMenu.menuName,
          menuParentId: selectedMenu.menuParentId,
          access: true,
          menuRoleMappingId: this.generateNewMenuRoleMappingId(),
          isBold: true, // Mark parent as bold
        });
        this.selectedMenuIds.push(selectedMenu.menuID);
      }

      // Get all child menus of this parent
      const childMenus = this.flatMenuList.filter(
        (menu: any) => menu.menuParentId === selectedMenu.menuID,
      );

      // Add child menus right after the parent
      const parentIndex = this.menuListRole.findIndex(
        (menu) => menu.menuID === selectedMenu.menuID,
      );
      let insertIndex = parentIndex + 1;

      childMenus.forEach((childMenu: any) => {
        if (
          !this.menuListRole.some((menu) => menu.menuID === childMenu.menuID)
        ) {
          this.menuListRole.splice(insertIndex, 0, {
            menuID: childMenu.menuID,
            menuName: childMenu.menuName,
            menuParentId: childMenu.menuParentId,
            access: true,
            menuRoleMappingId: this.generateNewMenuRoleMappingId(),
          });
          this.selectedMenuIds.push(childMenu.menuID);
          insertIndex++; // Increment for next child
        }
      });
    } else {
      // CHILD MENU SELECTED - Add parent first, then child

      // Find the parent menu
      const parentMenu = this.flatMenuList.find(
        (menu: any) => menu.menuID === selectedMenu.menuParentId,
      );

      if (parentMenu) {
        // Add parent first (if not already added)
        if (
          !this.menuListRole.some((menu) => menu.menuID === parentMenu.menuID)
        ) {
          this.menuListRole.push({
            menuID: parentMenu.menuID,
            menuName: parentMenu.menuName,
            menuParentId: parentMenu.menuParentId,
            access: true,
            menuRoleMappingId: this.generateNewMenuRoleMappingId(),
            isBold: true, // Mark parent as bold
          });
          this.selectedMenuIds.push(parentMenu.menuID);
        }

        // Add child menu right after parent
        if (
          !this.menuListRole.some((menu) => menu.menuID === selectedMenu.menuID)
        ) {
          const parentIndex = this.menuListRole.findIndex(
            (menu) => menu.menuID === parentMenu.menuID,
          );
          this.menuListRole.splice(parentIndex + 1, 0, {
            menuID: selectedMenu.menuID,
            menuName: selectedMenu.menuName,
            menuParentId: selectedMenu.menuParentId,
            access: true,
            menuRoleMappingId: this.generateNewMenuRoleMappingId(),
          });
          this.selectedMenuIds.push(selectedMenu.menuID);
        }
      }
    }

    // Reset dropdown selection
    this.addRolemenuForm.get('menuDropdown')?.setValue('');
  }

  getAllRoleList() {
    this.service.get('api/Roles/GetRoles').subscribe((res: any) => {
      this.roleList = res;
      const uniqueRoles = new Map();
      res
        .filter((item: any) => item.status === 1)
        .forEach((role: any) => {
          if (!uniqueRoles.has(role.roleName)) {
            uniqueRoles.set(role.roleName, role);
          }
        });
      this.activRoleList = Array.from(uniqueRoles.values());

      if (!this.isEditMode) {
        this.initializeFormConfig();
      }
    });
  }

  initializeFormConfig() {
    this.mapRolesFormConfig = {
      formTitle: 'Map Roles',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'RoleID',
              label: 'Role Name',
              type: 'select',
              colSpan: 1,
              value: '',
              options: this.activRoleList.map((role: any) => ({
                label: role.roleName,
                value: role.roleID,
              })),
              validations: [
                { type: 'required', message: 'Role Name is required' },
              ],
            },
          ],
        },
      ],
      submitLabel: 'Save',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data) => this.sendData(data),
      onCancel: () => this.goBack(),
    };
    this.editRoleFormLoaded = true;
  }

  loadAllMenusForAdd() {
    // For add mode, load all menus from menuListMaster
    if (!this.menuListMaster || this.menuListMaster.length === 0) {
      return;
    }

    this.menuListRole = [];

    // Add all menus (parents and children) with access = false
    this.menuListMaster.forEach((parent: any) => {
      // Add parent menu
      this.menuListRole.push({
        menuID: parent.menuID,
        menuName: parent.menuName,
        menuDisplayName: parent.menuDisplayName || parent.menuName,
        menuParentId: parent.menuParentId,
        access: false,
        isParent: true,
        isBold: true,
      });

      // Add child menus
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach((child: any) => {
          this.menuListRole.push({
            menuID: child.menuID,
            menuName: child.menuName,
            menuDisplayName: child.menuDisplayName || child.menuName,
            menuParentId: child.menuParentId,
            access: false,
            isParent: false,
          });
        });
      }
    });

    this.groupMenusByCategory();
  }

  // toggleMenuAccess(menu: any) {
  //   menu.access = !menu.access;
  // }

  isMenuSelected(menuID: string): boolean {
    return this.selectedMenuIds.includes(menuID);
  }

  // Function to toggle menu access (checked/unchecked)
  // toggleMenuAccess(menu: any) {
  //   const index = this.selectedMenuIds.indexOf(menu.menuID);
  //   if (index > -1) {
  //     this.selectedMenuIds.splice(index, 1); // Remove if unchecked
  //   } else {
  //     this.selectedMenuIds.push(menu.menuID); // Add if checked
  //   }
  //   menu.access = !menu.access;

  // }
  toggleMenuAccess(menu: any) {
    menu.access = !menu.access;

    // If the clicked menu is a parent, toggle all its child menus
    if (menu.isParent || !menu.menuParentId) {
      this.menuListRole.forEach((childMenu: any) => {
        if (childMenu.menuParentId === menu.menuID) {
          childMenu.access = menu.access;
          // Update selectedMenuIds
          if (menu.access) {
            if (!this.selectedMenuIds.includes(childMenu.menuID)) {
              this.selectedMenuIds.push(childMenu.menuID);
            }
          } else {
            const index = this.selectedMenuIds.indexOf(childMenu.menuID);
            if (index > -1) {
              this.selectedMenuIds.splice(index, 1);
            }
          }
        }
      });
    } else {
      // If a child menu is unchecked, uncheck the parent as well
      const parentMenu = this.menuListRole.find(
        (m: any) => m.menuID === menu.menuParentId,
      );
      if (parentMenu && !menu.access) {
        parentMenu.access = false;
        const index = this.selectedMenuIds.indexOf(parentMenu.menuID);
        if (index > -1) {
          this.selectedMenuIds.splice(index, 1);
        }
      }
    }

    // Update selectedMenuIds
    if (menu.access) {
      if (!this.selectedMenuIds.includes(menu.menuID)) {
        this.selectedMenuIds.push(menu.menuID);
      }
    } else {
      const index = this.selectedMenuIds.indexOf(menu.menuID);
      if (index > -1) {
        this.selectedMenuIds.splice(index, 1);
      }
    }

    // Update grouped categories to reflect changes
    this.groupMenusByCategory();
  }

  toggleSelectAll(isChecked: boolean) {
    this.menuListRole.forEach((menu: any) => {
      menu.access = isChecked;
      if (isChecked) {
        if (!this.selectedMenuIds.includes(menu.menuID)) {
          this.selectedMenuIds.push(menu.menuID);
        }
      } else {
        const index = this.selectedMenuIds.indexOf(menu.menuID);
        if (index > -1) {
          this.selectedMenuIds.splice(index, 1);
        }
      }
    });
    // Update grouped categories to reflect changes
    this.groupedMenuCategories.forEach((category: any) => {
      if (category.menus) {
        category.menus.forEach((menu: any) => {
          menu.access = isChecked;
          // Also update in the main menuListRole
          const menuInList = this.menuListRole.find(
            (m: any) => m.menuID === menu.menuID,
          );
          if (menuInList) {
            menuInList.access = isChecked;
          }
        });
      }
    });
    this.groupMenusByCategory();
  }

  isCategoryAllSelected(category: any): boolean {
    if (!category.menus || category.menus.length === 0) {
      return false;
    }
    return category.menus.every((menu: any) => menu.access);
  }

  toggleCategoryAll(category: any, isChecked: boolean) {
    if (category.menus) {
      category.menus.forEach((menu: any) => {
        menu.access = isChecked;
        // Also update in the main menuListRole
        const menuInList = this.menuListRole.find(
          (m: any) => m.menuID === menu.menuID,
        );
        if (menuInList) {
          menuInList.access = isChecked;
        }
        if (isChecked) {
          if (!this.selectedMenuIds.includes(menu.menuID)) {
            this.selectedMenuIds.push(menu.menuID);
          }
        } else {
          const index = this.selectedMenuIds.indexOf(menu.menuID);
          if (index > -1) {
            this.selectedMenuIds.splice(index, 1);
          }
        }
      });
    }
  }

  isAllSelected(): boolean {
    return (
      this.menuListRole.length > 0 &&
      this.menuListRole.every((menu: any) => menu.access)
    );
  }

  handleSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm) {
      // Filter menuListRole based on search term
      const filteredMenus = this.menuListRole.filter(
        (menu: any) =>
          menu.menuName?.toLowerCase().includes(searchTerm) ||
          menu.menuDisplayName?.toLowerCase().includes(searchTerm),
      );

      // Rebuild grouped categories with filtered menus
      this.groupMenusByCategory();
      this.groupedMenuCategories = this.groupedMenuCategories
        .map((category: any) => {
          const filteredCategoryMenus = category.menus.filter(
            (menu: any) =>
              filteredMenus.some((fm: any) => fm.menuID === menu.menuID) ||
              (menu.menuParentId &&
                filteredMenus.some(
                  (fm: any) => fm.menuID === menu.menuParentId,
                )),
          );
          return {
            ...category,
            menus: filteredCategoryMenus,
          };
        })
        .filter((category: any) => category.menus.length > 0);
    } else {
      // Reset to show all menus
      this.groupMenusByCategory();
    }
  }

  sendData(formValue: any) {
    const selectedRoleID =
      formValue.RoleID || this.addRolemenuForm.get('RoleID')?.value;

    if (!selectedRoleID) {
      this.notificationService.showError('Please select a Role before saving.');
      return;
    }

    // Get all explicitly checked menus (access = true) - includes both parent and child menus
    const selectedMenus = this.menuListRole.filter(
      (menu: any) => menu.access === true,
    );

    if (selectedMenus.length === 0) {
      this.notificationService.showError('Please select at least one menu.');
      return;
    }

    // Separate selected child menus and parent menus
    const selectedChildMenus = selectedMenus.filter(
      (menu: any) => menu.menuParentId !== null && !menu.isParent,
    );
    const selectedParentMenus = selectedMenus.filter(
      (menu: any) => menu.menuParentId === null || menu.isParent,
    );

    // Create a set of parent menu IDs that have at least one selected child
    const parentsWithSelectedChildren = new Set<string>();
    selectedChildMenus.forEach((childMenu: any) => {
      if (childMenu.menuParentId) {
        parentsWithSelectedChildren.add(childMenu.menuParentId);
      }
    });

    // Create a map to track which menus to include in payload
    const menuIdsToSave = new Set<string>();
    const menuMap = new Map<string, any>();

    // First, add all selected child menus
    selectedChildMenus.forEach((menu: any) => {
      menuIdsToSave.add(menu.menuID);
      menuMap.set(menu.menuID, menu);
    });

    // Include parent menus ONLY if they have at least one selected child
    selectedParentMenus.forEach((parentMenu: any) => {
      // Only include parent if it has selected children
      if (parentsWithSelectedChildren.has(parentMenu.menuID)) {
        menuIdsToSave.add(parentMenu.menuID);
        menuMap.set(parentMenu.menuID, parentMenu);
      }
    });

    // Also add any parent menus that aren't explicitly selected but have selected children
    parentsWithSelectedChildren.forEach((parentMenuID: string) => {
      if (!menuIdsToSave.has(parentMenuID)) {
        const parentMenu = this.menuListRole.find(
          (m: any) => m.menuID === parentMenuID,
        );
        if (parentMenu) {
          menuIdsToSave.add(parentMenu.menuID);
          menuMap.set(parentMenu.menuID, parentMenu);
        }
      }
    });

    // Build payload with selected child menus and their parents (only parents with selected children)
    const roleMenuMappings = Array.from(menuIdsToSave).map((menuID: string) => {
      const menu = menuMap.get(menuID);
      // For edit mode, use existing menuRoleMappingId if available, otherwise generate new
      // For add mode, always generate new
      const menuRoleMappingId =
        this.isEditMode && menu?.menuRoleMappingId
          ? menu.menuRoleMappingId
          : this.generateNewMenuRoleMappingId();

      return {
        menuRoleMappingId: menuRoleMappingId,
        menuID: menu.menuID,
        roleID: selectedRoleID,
      };
    });

    if (roleMenuMappings.length === 0) {
      this.notificationService.showError('Please select at least one menu.');
      return;
    }

    // Use single bulk call (PUT) for both add and edit to avoid rate limits
    // For add mode, menuRoleMappingId can be a generated GUID; backend can treat as new
    const bulkPayload = roleMenuMappings.map((m: any) => ({
      menuRoleMappingId: m.menuRoleMappingId,
      menuID: m.menuID,
      roleID: m.roleID,
    }));

    this.service.post('api/Roles/Updatemenumapping', bulkPayload).subscribe(
      () => {
        this.notificationService.showSuccess('Mappings saved successfully!');
        this.router.navigate(['/MenuMaster/MenuRoleMapping']);
      },
      (error) => {
        console.error('Error saving mappings:', error);
        this.notificationService.showError(
          'Failed to save mappings. Please try again.',
        );
      },
    );
  }

  // Helper function to generate a new menuRoleMappingId (you can replace it with a backend service to generate the ID)
  generateNewMenuRoleMappingId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  goBack(): void {
    this.location.back();
  }
}
