import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AccountService } from '../../shared/services/account.service';
import { DialogService } from '../../shared/services/dialog.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';

@Component({
  selector: 'app-roles',
  imports: [NemoReusableTblComponent],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  public dataSource: any[] = [];
  public columns = [
    { field: 'srNo', header: '#' },
    { field: 'roleName', header: 'Name' },
    { field: 'roleDisplayName', header: 'Display Name' },
    { field: 'remarks', header: 'Remarks' },
    { field: 'status', header: 'Status' },
  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  detailsRow: boolean = false;
  deleteRow: boolean = false;
  roleList: any[] = [];
  constructor(
    private service: AccountService,
    private dialogueService: DialogService,
    private router: Router,
  ) {}
  ngOnInit(): void {
    this.getAllRoleList();
    this.detailsRow = false;
  }

  onEditRow(row: any) {
    console.log(row);
    this.router.navigate(['/userRolesAndPermissions/updateRoles', row.roleID]);
  }

  get dataArray(): any[] {
    return this.dataSource;
  }
  // filterChange(data: Event) {
  //   const value = (data.target as HTMLInputElement).value;
  //   this.dataSource.filter = value;
  // }
  // getAllRoleList() {
  //   this.roleService.getAllRoleList().subscribe((res: any) => {
  //     console.log(res);
  //     this.dataSource.data = res;
  //     this.dataSource.sort = this.sort;
  //     this.dataSource.paginator = this.paginator;
  //   });
  // }

  getAllRoleList() {
    this.service.get('api/Roles/GetRoles').subscribe((data: any) => {
      console.log('dept id', data);
      this.roleList = data;
      this.roleList = data.map((item: any, index: any) => ({
        ...item,
        roleName: item.roleName,
        srNo: index + 1,
        status: item.status === 1 ? 'Active' : 'Not Active',
      }));
      // Sort the data by roleName in ascending order
      this.roleList.sort((a, b) => a.roleName.localeCompare(b.roleName));

      // Update srNo based on sorted order
      this.roleList.forEach((item, index) => {
        item.srNo = index + 1;
      });
      this.dataSource = this.roleList;
    });
  }
  handleSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm) {
      this.dataSource = this.roleList.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm),
        ),
      );
    } else {
      this.dataSource = [...this.roleList]; // Reset to original data
    }
  }
  addRole(): void {
    this.router.navigate(['userRolesAndPermissions/addRoles']);
  }

  // editRole(element:any){
  //   this.roleService.setRoleData(element)
  //   this.router.navigate(['/userRolesAndPermissions/updateRoles'])
  // }

  deleteRole(row: any) {
    console.log(row.roleID);

    this.dialogueService
      .openConfirmDialog(
        'Delete Employee',
        'Are you sure you want to delete this Role?',
        'Yes',
        'No',
      )
      .afterClosed()
      .subscribe((res) => {
        console.log(res);
        if (res) {
          this.service.delete(row.roleID).subscribe(() => {
            console.log('deleted');
            this.getAllRoleList();
          });
        }
      });
  }
}
