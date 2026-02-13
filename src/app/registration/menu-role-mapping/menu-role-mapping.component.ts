import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AccountService } from '../../shared/services/account.service';
import { DialogService } from '../../shared/services/dialog.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';

@Component({
  selector: 'app-menu-role-mapping',
  imports: [NemoReusableTblComponent],
  templateUrl: './menu-role-mapping.component.html',
  styleUrls: ['./menu-role-mapping.component.scss'],
})
export class MenuRoleMappingComponent {
  public dataSource: any[] = [];

  public columns = [
    { field: 'srNo', header: '#' },
    { field: 'roleName', header: 'Role Name' },
    { field: 'accessHeaders', header: 'Access Headers' },
  ];
  MenuroleDetails: boolean = false;
  deleteRow: boolean = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  menuRollMapping: any[] = [];
  onDeleteDepartment: boolean = true;
  constructor(
    private service: AccountService,
    private dialogueService: DialogService,
    private router: Router,
  ) {}
  ngOnInit(): void {
    this.getMenuMaster();
    this.onDeleteDepartment = true;
    this.MenuroleDetails = false;
  }
  get dataArray(): any[] {
    return this.dataSource;
  }
  onEditRow(row: any) {
    this.router.navigate(['MenuMaster/editMenuRoleMapping', row.roleID]);
  }

  // filterChange(data: Event) {
  //   const value = (data.target as HTMLInputElement).value;
  //   // this.dataSource.filter = value;
  // }
  // getMenuMaster() {
  //   this.roleService.getAllRoleMenuList().subscribe((data: any) => {
  //     console.log("..//./",data);
  //     var formattedData = data.map((item:any) => ({
  //       menuRoleMappingId:item.menuRoleMappingId,
  //       roleName: item.roleMaster?.roleName || 'N/A',
  //       menuName:item.menuMaster?.menuName
  //     }));
  //     console.log('',formattedData)
  //     this.dataSource.data = formattedData;
  //     this.dataSource.sort = this.sort;
  //     this.dataSource.paginator = this.paginator;
  //   });
  // }
  getMenuMaster() {
    this.service.get('api/Roles/Getmenumapping').subscribe((data: any) => {
      // First, map the data to add serial number (srNo) and convert status to 'Active' or 'Not Active'
      this.menuRollMapping = data.map((item: any, index: number) => ({
        ...item,
        srNo: index + 1, // Adding serial number
        status: item.status === 1 ? 'Active' : 'Not Active', // Formatting status
      }));

      // Format the data to extract relevant fields
      let formattedData = this.menuRollMapping.map((item: any) => ({
        menuRoleMappingId: item.menuRoleMappingId,
        roleID: item.roleMaster?.roleID || 'N/A', // Handle cases where roleID might be missing
        roleName: item.roleMaster?.roleName || 'N/A', // Handle cases where roleName might be missing
        menuName: item.menuMaster?.menuName || 'N/A', // Handle cases where menuName might be missing
        menuParentId: item.menuMaster?.menuParentId, // Get parent menu ID to identify parent menus
        srNo: item.srNo, // Maintain the serial number
        status: item.status, // Maintain the formatted status
      }));

      // Group by roleID and aggregate only parent menu names
      const roleMap = new Map();
      formattedData.forEach((item: any) => {
        const roleID = item.roleID;
        if (!roleMap.has(roleID)) {
          roleMap.set(roleID, {
            menuRoleMappingId: item.menuRoleMappingId,
            roleID: item.roleID,
            roleName: item.roleName,
            srNo: item.srNo,
            status: item.status,
            menuNames: [] as string[],
          });
        }
        // Add menu name only if it's a parent menu (menuParentId is null or undefined)
        // and it exists and is not already in the array
        const isParentMenu =
          item.menuParentId === null || item.menuParentId === undefined;
        if (
          isParentMenu &&
          item.menuName &&
          item.menuName !== 'N/A' &&
          !roleMap.get(roleID).menuNames.includes(item.menuName)
        ) {
          roleMap.get(roleID).menuNames.push(item.menuName);
        }
      });

      // Convert map to array and create accessHeaders field
      let uniqueRoles = Array.from(roleMap.values()).map(
        (role: any, index: number) => ({
          ...role,
          srNo: index + 1, // Reassign serial number based on unique roles
          accessHeaders: role.menuNames.join(', '), // Join menu names with comma and space
        }),
      );

      // Sort by roleName in ascending order
      uniqueRoles.sort((a: any, b: any) => {
        const roleNameA = (a.roleName || '').toLowerCase();
        const roleNameB = (b.roleName || '').toLowerCase();
        if (roleNameA < roleNameB) return -1;
        if (roleNameA > roleNameB) return 1;
        return 0;
      });

      // Reassign serial numbers after sorting
      uniqueRoles = uniqueRoles.map((role: any, index: number) => ({
        ...role,
        srNo: index + 1,
      }));

      console.log('Formatted Unique Data:', uniqueRoles);

      // Assign the final processed data to dataSource
      this.dataSource = uniqueRoles;
    });
  }

  handleSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (searchTerm) {
      this.dataSource = this.menuRollMapping.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm),
        ),
      );
    } else {
      this.dataSource = [...this.menuRollMapping]; // Reset to original data
    }
  }

  addMenuRoleMapping(): void {
    this.router.navigate(['/MenuMaster/addMenuRoleMapping']);
  }

  editRoleMenuMapping(element: any) {
    let id = element.menuRoleMappingId;
    this.router.navigate(['MenuMaster/EditMenuRoleMapping', id]);
  }

  deleteMenu(row: any) {
    this.dialogueService
      .openConfirmDialog(
        'Delete Menu Role',
        'Are you sure you want to delete this Menu Role?',
        'Yes',
        'No',
      )
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.service
            .delete(
              `api/Roles/DeleteMenuMasterRoleMapping?MenuRoleMappingId=${row.roleID}`,
            )
            .subscribe(
              () => {
                console.log('Deleted successfully');
                this.getMenuMaster();
              },
              (error) => {
                console.error('API Error:', error);
              },
            );
        }
      });
  }
}
