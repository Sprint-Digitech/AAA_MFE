import { Component,ChangeDetectorRef } from '@angular/core';
import { Router ,NavigationEnd} from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
import { AccountService } from '../../shared/services/account.service';
import { UtilityService } from '../../shared/services/utility.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-branch-probation-settings-list',
  imports: [NemoReusableTblComponent],
  templateUrl: './branch-probation-settings-list.component.html',
  styleUrl: './branch-probation-settings-list.component.scss'
})
export class BranchProbationSettingsListComponent {
payHeadId: any;
  originalData: any[] = [];
  payheadList: any[] = [];
  branchesList: any[] = [];
  selectedBranchesid: string[] = [];
  userRole: string | null = null;
  loginData: any;
  companyId: any;
  TemplateData: any = [];
  public dataSource: any[] = [];
  deletePayhead = false; // Controls delete option visibility
  private routerSubscription?: Subscription;


  // Revised columns for your table
  columns = [
    { field: 'srNo', header: '#' },
    { field: 'companyBranchName', header: 'Branch' },
    {field: 'departmentName', header: 'Department' },
    {field: 'designationName', header: 'Designation' },
    { field: 'probationPeriodDays', header: 'Probation Days' },
    { field: 'isProbationMandatory', header: 'Is Probation Mandatory' },
    { field: 'status', header: 'Status' }
  ];

  constructor(
    private service: AccountService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }
  ngOnInit(): void {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.companyId = user.companyId;
      this.loadBranches();
    }
    
    // Refresh data when navigating back to this component
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/branch-probation-setting' || event.urlAfterRedirects === '/branch-probation-setting') {
          if (this.companyId) {
            this.loadBranches();
          }
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  addBranch() {
    this.router.navigate(['/add-branch-probation-setting'])
  }

  loadBranches(): void {
    if (!this.companyId) return;
    this.service.get(`api/company-branch/GetCompanyBranch?companyId=${this.companyId}`)
      .subscribe({
        next: (Data: any[]) => {
          this.branchesList = Data.map(branch => ({ ...branch, id: branch.id.toString() }));
          this.getBranchProbationSetting();
        },
        error: (err) => {
          this.notificationService.showError('Failed to load branches');
          console.error('Failed to load branches:', err);
        }
      });
  }

  getBranchProbationSetting(): void {
    this.service.get('api/company-branch/GetBranchProbationSetting').subscribe({
      next: (response: any) => {
        this.dataSource = UtilityService.mapWithSerialNumbers(response).map((item: any) => {
          // Ensure companyBranchId is converted to string for comparison
          const branchId = item.companyBranchId ? item.companyBranchId.toString() : '';
          const branch = this.branchesList.find(
            (b: any) => b.id === branchId || b.id === item.companyBranchId
          );
          return {
            ...item,
            companyBranchName: branch ? branch.companyBranchName : 'Unknown',
            probationPeriodDays: item.probationPeriodDays,
            isProbationMandatory: item.isProbationMandatory ? 'Yes' : 'No',
            branchProbationSettingId: item.branchProbationSettingId,
            designationName: item.designationName || '-',
            departmentName: item.departmentName || '-',
            status: item.status? 'Active' : 'Inactive'
          };
        });

        this.originalData = response;
        // Trigger change detection to refresh UI
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showError('Failed to load data');
        console.error('Failed to fetch branch probation settings:', err);
      }
    });
  }
  get dataArray(): any[] {
    return this.dataSource;
  }

  onEditRow(row: any) {
    this.router.navigate(['/update-branch-probation-setting', row.branchProbationSettingId])
  }

  handleSearch(event: any): void {
    const query = event.target.value.toLowerCase();
    this.dataSource = this.originalData.filter(item =>
      item.payHeadName?.toLowerCase().includes(query)
    );
  }
}
