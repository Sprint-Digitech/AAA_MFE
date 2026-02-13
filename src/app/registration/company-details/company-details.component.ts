import { Component, Injectable, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AddBranchComponent } from '../add-branch/add-branch.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from '../../shared/services/account.service';
import { DialogService } from '../../shared/services/dialog.service';
import { NotificationService } from '../../shared/services/notification.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';

// 2. Add the decorator here
@Injectable({
  providedIn: 'root',
})
class ExpandedPanelServiceService {
  expandedPanelIndex = 0;

  constructor() {}
}

@Component({
  selector: 'app-company-details',
  imports: [CommonModule, NemoReusableTblComponent],
  templateUrl: './company-details.component.html',
  styleUrls: ['./company-details.component.scss'],
})
export class CompanyDetailsComponent implements OnInit {
  details: any;
  branches: any;
  companyId: any;
  public dataSource: any[] = [];
  public companyDetailList: any[] = [];
  onDeleteComapnyDetail: boolean = true;
  onCompanyDetail: boolean = true;

  public columns = [
    { field: 'srNo', header: '#' },
    { field: 'companyBranchName', header: 'Name' },
    { field: 'currencyName', header: 'Currency' },
  ];

  constructor(
    private activeRoute: ActivatedRoute,
    private reposotory: AccountService,
    private dialogService: DialogService,
    private dialogForm: MatDialog,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private expandedPanelService: ExpandedPanelServiceService,
    private location: Location,
  ) {}
  ngOnInit(): void {
    this.getDetails();
    this.getBranchDetails();
    this.onDeleteComapnyDetail = true;
    this.onCompanyDetail = true;
    if (this.expandedPanelService.expandedPanelIndex !== null) {
      this.expandedPanelIndex = this.expandedPanelService.expandedPanelIndex;
    }
  }

  expandedPanelIndex: number | undefined;

  panelChanged(index: number): void {
    this.expandedPanelService.expandedPanelIndex = index;
  }

  public getDetails = () => {
    this.route.params.subscribe((params) => {
      this.companyId = params['companyId'];
    });

    this.reposotory
      .getCompany(`api/company-branch/GetCompany?id=${this.companyId}`)
      .subscribe({
        next: (data) => {
          this.details = data[0];
        },
      });
  };

  public getBranchDetails = () => {
    this.reposotory
      .get(`api/company-branch/GetCompanyBranch?companyId=${this.companyId}`)
      .subscribe({
        next: (branchData) => {
          this.companyDetailList = branchData
            .sort((a, b) =>
              a.companyBranchName.localeCompare(b.companyBranchName),
            )
            .map((item: any, index: number) => ({
              ...item,
              srNo: index + 1,
              currencyName: item.currency?.currencyName || '',
            }));
          this.dataSource = this.companyDetailList;
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage =
            error.error instanceof ErrorEvent
              ? `Error: ${error.error.message}`
              : `Error Code: ${error.status}\nMessage: ${error.message}`;
          this.notificationService.showError(errorMessage);
        },
      });
  };

  get dataArray(): any[] {
    return this.dataSource;
  }

  onEditRow(row: any) {
    this.router.navigate([
      '/company/updateBranch',
      row.companyId,
      row.companyBranchId || row.id,
    ]);
  }

  onDetailRow(row: any) {
    this.router.navigate([
      '/company/branchDetails',
      row.companyId,
      row.companyBranchId || row.id,
    ]);
  }

  openAddForm(companyId: any) {
    const dialogRef = this.dialogForm.open(AddBranchComponent, {
      height: '80%',
      width: '60%',
      data: {
        companyId: companyId,
      },
    });
    dialogRef.afterClosed().subscribe(() => {
      setTimeout(() => {
        this.getBranchDetails();
      }, 500);
    });
  }

  openUpdateForm(companyId: any, companyBranchId: any) {
    const dialogRef = this.dialogForm.open(AddBranchComponent, {
      height: '80%',
      width: '60%',
      data: {
        companyId: companyId,
        companyBranchId: companyBranchId,
      },
    });
    dialogRef.afterClosed().subscribe(() => {
      setTimeout(() => {
        this.getBranchDetails();
      }, 500);
    });
  }

  goBack(): void {
    this.router.navigate(['company/list']);
    // this.location.back();
  }

  addCompanyDetail(): void {
    this.router.navigate(['company/addBranch', this.companyId]);
  }

  deleteBranch = (row: any) => {
    this.dialogService
      .openConfirmDialog(
        'Delete Branch',
        'Are you sure you want to delete this branch',
        'Delete',
        'Cancel',
      )
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reposotory
            .delete(
              `api/CompanyBranch/DeleteCompanyBranch?GuidCompanyBranchId=${row.id}`,
            )
            .subscribe(() => {
              this.notificationService.showSuccess(
                'Branch deleted successfully',
              );
              this.getBranchDetails();
            });
        }
      });
  };
}
