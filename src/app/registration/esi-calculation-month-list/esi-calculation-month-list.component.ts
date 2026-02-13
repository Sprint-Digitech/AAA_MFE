import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { NotificationService } from '../../shared/services/notification.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
import { AccountService } from '../../shared/services/account.service';
import { UtilityService } from '../../shared/services/utility.service';
import { BranchFilterService } from "../../shared/services/branch-filter.service";
@Component({
  selector: 'app-esi-calculation-month-list',
  imports: [NemoReusableTblComponent],
  templateUrl: './esi-calculation-month-list.component.html',
  styleUrl: './esi-calculation-month-list.component.scss'
})
export class EsiCalculationMonthListComponent {
 public dataSource: any[] = [];
  public columns = [
    { field: 'srNo', header: '#' },
    { field: 'branchName', header: 'Branch Name' },
    { field: 'firstMonth', header: 'First Month' },
    { field: 'secondMonth', header: 'Second Month' },
    { field: 'status', header: 'Status' },
  ];
  originalData: any[] = [];
  DetailsEsiCalculationMonthLimit: boolean = false;
  branchMap: { [key: string]: string } = {};
  companyId: any;
  branchesList: any[] = [];
  selectedBranchesid: string[] = [];
  branchFilterOptions: { label: string; value: any; field: string }[] = [];

  constructor(
    private service: AccountService,
    private notificationService: NotificationService,
    private branchFilterService: BranchFilterService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const userData = sessionStorage.getItem('user');

    if (userData) {
      const user = JSON.parse(userData); // convert string to object

      const companyId = user.companyId;
      if (companyId) {
        this.companyId = companyId;
      }
      this.loadBranches();
    }
    this.getEsiCalculationMonthLimit();
    this.DetailsEsiCalculationMonthLimit = false;
  }
  loadBranches(): void {
    if (!this.companyId) {
      return;
    }
    this.branchFilterService.loadBranches(this.companyId).subscribe({
      next: (allBranches) => {
        this.branchesList = allBranches;
        this.branchMap = {};
        allBranches.forEach(branch => {
          this.branchMap[branch.id] = branch.companyBranchName;
        });

        this.branchFilterOptions = this.branchFilterService.createFilterOptions(allBranches, 'companyBranchId');
        console.log("Branch filter options:", this.branchFilterOptions);
        console.log('Branches List:', this.branchesList);
        this.getEsiCalculationMonthLimit();
      },
      error: (err) => {
        console.error('Failed to load branches:', err);
        this.notificationService.showError('Failed to load branches');
      }
    });
  }
  getEsiCalculationMonthLimit(): void {
    this.service.get('api/Currency/GetESICalculationMonthLimit').subscribe({
      next: (data: any[]) => {
        this.originalData = data
          .map((item, index) => ({
            ...item,
            srNo: (index + 1).toString().padStart(2, '0'),
            branchName: this.branchMap[item.branchID] || 'N/A',
            status: UtilityService.normalizeStatus(item.status) === 1 ? 'Active' : 'Inactive',
          }));
        this.dataSource = [...this.originalData];
      },
      error: (err) => {
        this.notificationService.showError('Failed to fetch data');
      },
    });
  }
  get dataArray(): any[] {
    return this.dataSource;
  }
  onEditRow(Row: any) {
    this.router.navigate(['/updateEsiCalculationMonthLimit', Row.esiCalculationMonthLimitID]);
  }
  addEsiCalculationMonthLimit(): void {
    this.router.navigate(['/addEsiCalculationMonthLimit']);
  }
}
