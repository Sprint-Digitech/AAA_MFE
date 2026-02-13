import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { HttpCacheService } from '../../shared/services/http-cache.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
import { DialogService } from '../../shared/services/dialog.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';
@Component({
  selector: 'app-companies',
  imports: [NemoReusableTblComponent],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss'],
})
export class CompaniesComponent implements OnInit, OnDestroy {
  public companies: any;
  public dataSource: any[] = [];
  public companyList: any[] = [];
  onDeleteComapny: boolean = false;
  onDetailCompany: boolean = true;
  private routerSubscription?: Subscription;
  private lastLoadedUrl?: string;

  public columns = [
    { field: 'srNo', header: '#' },
    { field: 'companyName', header: 'Company' },
    { field: 'CompanyGroup', header: 'Group' },
    { field: 'industry', header: 'Industry' },
  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialgoService: DialogService,
    private service: AccountService,
    private dialogForm: MatDialog,
    private notificationService: NotificationService,
    private cacheService: HttpCacheService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Always call API when component initializes
    const currentUrl = this.router.url;
    this.lastLoadedUrl = currentUrl;
    this.loadCompanyData();

    // Subscribe to route changes to ensure API is called when navigating to this route
    // This handles cases where Angular reuses the component instance
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Check if current route matches the company list route
        const newUrl = event.urlAfterRedirects || event.url;
        // Only load if we're navigating TO the company list route (different from last loaded URL)
        if (
          (newUrl === '/company/list' || newUrl.endsWith('/company/list')) &&
          this.lastLoadedUrl !== newUrl
        ) {
          this.lastLoadedUrl = newUrl;
          this.loadCompanyData();
        }
      });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private loadCompanyData(): void {
    // Invalidate cache for company list to prevent showing stale data
    this.cacheService.invalidatePattern(/Company\/CompanyList/i);

    // Clear existing data to prevent showing stale data
    this.dataSource = [];
    this.companyList = [];

    // Always fetch fresh data
    this.getCompanies();
    this.onDeleteComapny = false;
    this.onDetailCompany = true;
  }

  get dataArray(): any[] {
    return this.dataSource;
  }
  onEditRow(row: any) {
    this.router.navigate(['/company/update', row.companyId]);
  }

  onDetailRow(row: any) {
    this.router.navigate(['/company/details', row.companyId]);
  }

  getCompanies = () => {
    // Clear existing data before fetching new data
    this.dataSource = [];
    this.companyList = [];

    // Add X-No-Cache header to bypass HTTP cache and ensure fresh data
    const headers = new HttpHeaders().set('X-No-Cache', 'true');
    const apiAddress: string = 'api/company-branch/GetCompany';
    this.service.getCompany(apiAddress, headers).subscribe({
      next: (com: any[]) => {
        this.companyList = com
          .sort((a, b) => a.companyName.localeCompare(b.companyName))
          .map((item: any, index: number) => ({
            ...item,
            srNo: (index + 1).toString().padStart(2, '0'),
            CompanyGroup: item.companyGroup.companyGroupName,
          }));
        this.dataSource = this.companyList;
      },
      error: (err: HttpErrorResponse) => {
        const errorMessage =
          err.error instanceof ErrorEvent
            ? `Error: ${err.error.message}`
            : `Error Code: ${err.status}\nMessage: ${err.message}`;
        this.notificationService.showError(errorMessage);
      },
    });
  };
  handleSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (searchTerm) {
      this.dataSource = this.companyList.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm),
        ),
      );
    } else {
      this.dataSource = [...this.companyList]; // Reset to original data
    }
  }

  addCompany(): void {
    this.router.navigate(['company/add']);
  }

  deleteCompany(row: any) {
    this.dialgoService
      .openConfirmDialog(
        'Delete Company',
        'Are you sure you want to delete this company?',
        'Delete',
        'Cancel',
      )
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.service
            .delete(`api/Company/DeleteCompany?guidCompanyId=${row.companyId}`)
            .subscribe(() => {
              this.notificationService.showSuccess(
                'Company deleted successfully',
              );
              this.getCompanies();
            });
        }
      });
  }
}
