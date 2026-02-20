import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';
import { DialogService } from '../../shared/services/dialog.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
@Component({
  selector: 'app-company-group',
  imports: [NemoReusableTblComponent],
  templateUrl: './company-group.component.html',
  styleUrls: ['./company-group.component.scss'],
})
export class CompanyGroupComponent implements OnInit {
  public dataSource: any[] = [];
  public originalData: any[] = [];
  dltCompanyGroup: boolean = true;
  detailCompanyGroup: boolean = false;
  editCompanyGroup: boolean = true;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private service: AccountService,
    private dialogueService: DialogService,
  ) { }

  ngOnInit(): void {
    this.getCompanyGroup();
    this.dltCompanyGroup = false;
    this.detailCompanyGroup = false;
    this.editCompanyGroup = true;
  }

  public columns = [
    { field: 'sNo', header: '#' },
    { field: 'companyGroupName', header: 'Company Group' },
    { field: 'status', header: 'Status' },
  ];

  get dataArray(): any[] {
    return this.dataSource;
  }

  onEditRow(row: any) {
    this.router.navigate(['/company/updateCompanyGroup', row.id]);
  }

  // filterChange(data: Event) {
  //   const value = (data.target as HTMLInputElement).value;
  //   this.dataSource.filter = value;
  // }

  addCompanyGroup(): void {
    this.router.navigate(['/company/addCompanyGroup']);
  }

  handleSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (searchTerm) {
      this.dataSource = this.originalData.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm),
        ),
      );
    } else {
      this.dataSource = [...this.originalData]; // Reset to original data
    }
  }

  getCompanyGroup() {
    this.service.get('api/company-branch/GetCompanyGroup').subscribe({
      next: (response) => {
        this.originalData = response.sort((a, b) =>
          a.companyGroupName.localeCompare(b.companyGroupName),
        );
        this.originalData = response.map((item, index) => ({
          ...item,
          sNo: (index + 1).toString().padStart(2, '0'),
          status: item.status === 1 ? 'Active' : 'Not Active',
        }));
        this.dataSource = this.originalData;
        // this.dataSource.sort = this.sort;
        // this.dataSource.paginator = this.paginator;
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showError(errorMessage);
      },
    });
  }

  deleteCompanyGroup(row: any) {
    // First, get all companies to check if this group is in use
    this.service.get('api/company-branch/GetCompany').subscribe({
      next: async (companies: any[]) => {
        // Check if any company is using this group
        const companyUsing = await companies.find(
          (company) =>
            company.companyGroup && company.companyGroup.id === row.id,
        );

        if (companyUsing) {
          // Group is being used by a company, prevent deletion
          this.notificationService.showError(
            'Cannot delete this company group as it is being used by the company',
          );
        } else {
          // If not in use, proceed with deletion confirmation
          this.dialogueService
            .openConfirmDialog(
              'Delete Company Group',
              'Are you sure you want to delete company group?',
              'Yes',
              'No',
            )
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                this.service
                  .delete(
                    `api/CompanyGroup/DeleteCompanyGroup?guidCompanyGroupId=${row.id}`,
                  )
                  .subscribe(() => {
                    this.getCompanyGroup();
                    this.notificationService.showSuccess(
                      'Company Group deleted successfully',
                    );
                  });
              }
            });
        }
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'Error checking company usage';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showError(errorMessage);
      },
    });
  }
}
