import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AccountService } from '../../shared/services/account.service';
import { DialogService } from '../../shared/services/dialog.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';

@Component({
  selector: 'app-menu-master',
  imports: [NemoReusableTblComponent],
  templateUrl: './menu-master.component.html',
  styleUrls: ['./menu-master.component.scss'],
})
export class MenuMasterComponent {
  public dataSource: any[] = [];
  public originalData: any[] = []; // Store original data for search filtering
  public columns = [
    { field: 'srNo', header: '#' },
    { field: 'menuName', header: 'Name' },
    { field: 'menuDisplayName', header: 'Display Name' },
    { field: 'menuType', header: 'Path' },
    { field: 'menuHeader', header: 'Parent Menu' },
    { field: 'remarks', header: 'Description' },
    { field: 'status', header: 'Status' },
  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  menuMaster: any[] = [];
  menuMasterDetails: boolean = false;
  deleteMaster: boolean = false;
  constructor(
    private dialogueService: DialogService,
    private router: Router,
    private accountService: AccountService,
  ) {}
  ngOnInit(): void {
    this.getMenuMaster();
    this.menuMasterDetails = false;
  }
  onEditRow(row: any) {
    this.router.navigate(['/MenuMaster/updateMenuMaster', row.menuID]);
  }

  get dataArray(): any[] {
    return this.dataSource;
  }
  // filterChange(data: Event) {
  //   const value = (data.target as HTMLInputElement).value;
  //   this.dataSource.filter = value;
  // }
  // getMenuMaster() {
  //   this.service.getData('api/Menu/MenuMasterList').subscribe((data: any) => {
  //     console.log(".............", data);

  //     this.dataSource.data = data;
  //     this.dataSource.sort = this.sort;
  //     this.dataSource.paginator = this.paginator;
  //   });
  // }
  getMenuMaster() {
    this.accountService.get(`api/Roles/GetMenuMaster`).subscribe((data) => {
      console.log('dept id', data);
      this.menuMaster = data;
      this.menuMaster = data.map((item, index) => ({
        ...item,
        srNo: index + 1,
        menuName: item.menuName,
        menuDisplayName: item.menuDisplayName,
        menuType: item.menuPath,
        menuHeader: item.menuParent?.menuName,
        remarks: item.remarks,
        status: item.status === 1 ? 'Active' : 'Not Active',
      }));
      // Sort the data by employee name in ascending order
      this.menuMaster.sort((a, b) => a.menuName.localeCompare(b.menuName));

      // Update srNo based on sorted order
      this.menuMaster.forEach((item, index) => {
        item.srNo = index + 1;
      });
      this.dataSource = this.menuMaster;
      this.originalData = [...this.menuMaster]; // Store original data
    });
  }

  handleSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value
      .toLowerCase()
      .trim();
    console.log('Search term:', searchTerm);

    if (searchTerm) {
      this.dataSource = this.originalData.filter((item) => {
        const matches = Object.values(item).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
        return matches;
      });
      console.log('Filtered results:', this.dataSource.length);
    } else {
      this.dataSource = [...this.originalData]; // Reset to original data
      console.log('Reset to original data:', this.dataSource.length);
    }
  }

  addMenuMaster(): void {
    this.router.navigate(['/MenuMaster/addMenuMaster']);
  }

  deleteManu(row: any) {
    console.log(row);

    this.dialogueService
      .openConfirmDialog(
        'Delete Menu Master',
        'Are you sure you want to delete this Menu Master?',
        'Yes',
        'No',
      )
      .afterClosed()
      .subscribe((res) => {
        console.log(res);
        if (res) {
          this.accountService
            .delete(`api/Menu/DeleteMenuMaster?MenubyId=${row.menuID}`)
            .subscribe(() => {
              console.log('deleted');
              this.getMenuMaster();
              // Add a small delay to ensure backend has processed the deletion
              setTimeout(() => {
                // Reload menu data to reflect changes in sidebar immediately
                console.log('Reloading menu data after deletion...');
                this.accountService.reloadMenuData().subscribe({
                  next: (menus) => {
                    console.log(
                      'Menu data refreshed successfully after deletion. Menus count:',
                      menus?.length || 0,
                    );
                  },
                  error: (error) => {
                    console.error('Error refreshing menu data:', error);
                  },
                });
              }, 500); // 500ms delay to allow backend to process
            });
        }
      });
  }
}
