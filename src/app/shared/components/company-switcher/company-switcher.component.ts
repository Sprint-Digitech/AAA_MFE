import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import {
  CompanySwitcherService,
  ActiveCompany
} from '../../services/company-switcher.service';
import {
  HrmsAuthzService,
  AccessibleCompanyDto
} from '../../services/hrms-authz.service';

@Component({
  standalone: true,
  selector: 'app-company-switcher',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './company-switcher.component.html',
  styleUrls: ['./company-switcher.component.scss']
})
export class CompanySwitcherComponent implements OnInit, OnDestroy {

  companies: AccessibleCompanyDto[] = [];
  active: ActiveCompany | null = null;
  showDropdown = false;
  loading = false;

  private sub?: Subscription;

  constructor(
    private switcherSvc: CompanySwitcherService,
    private authzSvc: HrmsAuthzService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.switcherSvc.active$.subscribe(a => {
      this.active = a;
      this.cdr.markForCheck();
    });
    this.loadCompanies();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get displayName(): string {
    if (this.active?.hrmsCompanyId === '') return 'All Companies';
    return this.active?.companyName ?? 'Select Company';
  }

  get isAllSelected(): boolean {
    return this.active?.hrmsCompanyId === '';
  }

  selectAll(): void {
    if (!this.companies.length) return;
    const first = this.companies[0];
    const allBranches = this.companies.flatMap(c => c.branches.map(b => ({
      hrmsbranchId: b.hrmsBranchId,
      branchName: b.branchName,
      branchCode: b.branchCode
    })));
    const allCompany: ActiveCompany = {
      hrmsCompanyId: '',          // empty = "all companies" sentinel
      companyName: 'All Companies',
      hrmsGroupId: first.hrmsGroupId,
      groupName: first.groupName,
      branches: allBranches,
      roleName: first.roleName,
      selectedBranchId: null,
      selectedBranchName: null,
    };
    this.switcherSvc.switchTo(allCompany);
    this.showDropdown = false;
    this.cdr.markForCheck();
  }

  get activeBranchLabel(): string | null {
    return this.active?.selectedBranchName ?? null;
  }

  /** True if the user can switch between companies. */
  get canSwitchCompany(): boolean {
    return this.companies.length > 1;
  }

  /** True if the active company has more than one branch (branch-level switching possible). */
  get canSwitchBranch(): boolean {
    return (this.active?.branches?.length ?? 0) > 1;
  }

  /** True if the dropdown should open at all. */
  get canOpenDropdown(): boolean {
    return this.canSwitchCompany || this.canSwitchBranch;
  }

  /** Used for the company-count badge. */
  get hasMultiple(): boolean {
    return this.canSwitchCompany;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.canOpenDropdown) return;
    this.showDropdown = !this.showDropdown;
  }

  selectCompany(co: AccessibleCompanyDto): void {
    const active: ActiveCompany = {
      hrmsCompanyId: co.hrmsCompanyId,
      companyName: co.companyName,
      companyCode: co.companyCode,
      hrmsGroupId: co.hrmsGroupId,
      groupName: co.groupName,
      branches: co.branches.map(b => ({
        hrmsbranchId: b.hrmsBranchId,
        branchName: b.branchName,
        branchCode: b.branchCode
      })),
      departmentIds: co.departmentIds,
      departmentNames: co.departmentNames,
      roleName: co.roleName,
      selectedBranchId: null,   // reset to all branches on company switch
      selectedBranchName: null
    };
    this.switcherSvc.switchTo(active);
    this.showDropdown = false;
    this.cdr.markForCheck();
  }

  selectBranch(branchId: string | null, branchName: string | null): void {
    this.switcherSvc.switchBranch(branchId, branchName);
    if (!this.canSwitchCompany) {
      this.showDropdown = false;
    }
    this.cdr.markForCheck();
  }

  isSelectedCompany(co: AccessibleCompanyDto): boolean {
    return !this.isAllSelected && this.active?.hrmsCompanyId === co.hrmsCompanyId;
  }

  isSelectedBranch(branchId: string | null): boolean {
    const sel = this.active?.selectedBranchId ?? null;
    return sel === branchId;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showDropdown) {
      this.showDropdown = false;
      this.cdr.markForCheck();
    }
  }

  private loadCompanies(): void {
    this.loading = true;
    this.authzSvc.getMyCompanies().subscribe({
      next: data => {
        this.companies = data;
        // Auto-select first company on fresh login if nothing is already active
        if (!this.active && data.length > 0) {
          this.selectCompany(data[0]);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
}
