import { Component,ChangeDetectorRef } from '@angular/core';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { UtilityService } from '../../shared/services/utility.service';
import { Location,CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../shared/services/account.service';

interface EsiCalculationMonthLimitFormState {
  branchID: string;
  firstMonth: string;
  secondMonth: string;
  status: string;
}
export interface esiCalculationMonthLimitDto {
  esiCalculationMonthLimitID?: string;
  branchID: string;
  firstMonth: string;
  secondMonth: string;
  status: number;
}
@Component({
  selector: 'app-add-esi-calculation-month-limit',
  imports: [AddUpdateFormComponent, CommonModule],
  templateUrl: './add-esi-calculation-month-limit.component.html',
  styleUrl: './add-esi-calculation-month-limit.component.scss'
})
export class AddEsiCalculationMonthLimitComponent {
esiCalculationMonthLimitFormConfig?: FormConfig;
  branchesList: any[] = [];
  esiCalculationMonthLimitList: any[] = [];

  private esiCalculationMonthLimitId?: string;
  private isEditMode = false;
  private branchesListLoaded = false;
  private esiCalculationMonthLimitDetailsLoaded = false;
  private initialValues: EsiCalculationMonthLimitFormState = this.createEmptyState();
  private currentEsiCalculationMonthLimitData?: any;
  private companyId?: string;

  // Month options
  monthOptions = [
    { label: 'January', value: 'January' },
    { label: 'February', value: 'February' },
    { label: 'March', value: 'March' },
    { label: 'April', value: 'April' },
    { label: 'May', value: 'May' },
    { label: 'June', value: 'June' },
    { label: 'July', value: 'July' },
    { label: 'August', value: 'August' },
    { label: 'September', value: 'September' },
    { label: 'October', value: 'October' },
    { label: 'November', value: 'November' },
    { label: 'December', value: 'December' },
  ];

  constructor(
      private location: Location,
    private service: AccountService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCompanyId();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      const updateRoute = this.isUpdateRoute();
      this.esiCalculationMonthLimitId = updateRoute ? id ?? undefined : undefined;
      this.isEditMode = updateRoute && !!this.esiCalculationMonthLimitId;

      if (this.isEditMode) {
        this.fetchEsiCalculationMonthLimitDetails();
      } else {
        this.esiCalculationMonthLimitDetailsLoaded = false;
      }

      this.fetchBranches();
      this.fetchEsiCalculationMonthLimitList();
    });
  }

  private loadCompanyId(): void {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.companyId = user.companyId;
    }
  }

  private fetchBranches(): void {
    if (!this.companyId) {
      this.notificationService.showError('Company ID is missing. Cannot load branches.');
      return;
    }
    this.service
      .get(`api/company-branch/GetCompanyBranch?companyId=${this.companyId}`)
      .subscribe({
        next: (data: any[]) => {
          this.branchesList = (data ?? []).map((branch: any) => ({
            label: branch.companyBranchName || branch.branchName || 'Unknown Branch',
            value: branch.id || branch.branchID || branch.companyBranchId,
          }));
          this.branchesListLoaded = true;
          this.tryBuildFormConfig();
        },
        error: (error: HttpErrorResponse) => {
          this.notificationService.showError('Error fetching branches list');
        },
      });
  }

  private fetchEsiCalculationMonthLimitList(): void {
    this.service.get('api/Currency/GetESICalculationMonthLimit').subscribe({
      next: (data: any[]) => {
        this.esiCalculationMonthLimitList = data ?? [];
      },
      error: (error: HttpErrorResponse) => {
      },
    });
  }

  private fetchEsiCalculationMonthLimitDetails(): void {
    if (!this.esiCalculationMonthLimitId) {
      return;
    }
    this.service
      .get(
        `api/Currency/GetESICalculationMonthLimit?eSICalculationMonthLimitId=${this.esiCalculationMonthLimitId}`
      )
      .subscribe({
        next: (response: any) => {
             const data = Array.isArray(response) ? response[0] : response;

          if (!data) {
            this.notificationService.showError('No data found for this ID');
            return;
          }

          console.log('Extracted data object:', data);

          this.currentEsiCalculationMonthLimitData = data;
          this.esiCalculationMonthLimitDetailsLoaded = true;
          this.tryBuildFormConfig();
        },
        error: (error: HttpErrorResponse) => {
          this.notificationService.showError('Error fetching ESI Calculation Month Limit details');
        },
      });
  }

  private tryBuildFormConfig(): void {
    if (!this.branchesListLoaded) {
      return;
    }
    if (this.isEditMode && !this.esiCalculationMonthLimitDetailsLoaded) {
      return;
    }

    const initialState = this.isEditMode
      ? this.createStateFromEsiCalculationMonthLimit(this.currentEsiCalculationMonthLimitData)
      : this.createEmptyState();

    this.initialValues = { ...initialState };
    this.setFormConfig(initialState);
  }

  private setFormConfig(initialState: EsiCalculationMonthLimitFormState): void {
    this.esiCalculationMonthLimitFormConfig = this.generateFormConfig(initialState);
  }

  private isUpdateRoute(): boolean {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    return path.toLowerCase().includes('update');
  }

  private generateFormConfig(initialState: EsiCalculationMonthLimitFormState): FormConfig {
    const fields: any[] = [
      {
        name: 'branchID',
        label: 'Branch',
        type: 'select',
        placeholder: 'Select Branch',
        colSpan: 1,
        value: initialState.branchID,
        options: this.branchesList,
        validations: [{ type: 'required', message: 'Branch is required' }],
      },
      {
        name: 'firstMonth',
        label: 'First Month',
        type: 'select',
        placeholder: 'Select First Month',
        colSpan: 1,
        value: initialState.firstMonth,
        options: this.monthOptions,
        validations: [{ type: 'required', message: 'First month is required' }],
      },
      {
        name: 'secondMonth',
        label: 'Second Month',
        type: 'select',
        placeholder: 'Select Second Month',
        colSpan: 1,
        value: initialState.secondMonth,
        options: this.monthOptions,
        validations: [{ type: 'required', message: 'Second month is required' }],
      },
    ];

    fields.push({
      name: 'status',
      label: 'Status',
      type: 'radio',
      layout: 'horizontal',
      colSpan: 1,
      value: initialState.status,
      hidden: !this.isEditMode,
      validations: [{ type: 'required', message: 'Status is required' }],
      options: [
        { label: 'Active', value: '1' },
        { label: 'Inactive', value: '0' },
      ],
    });

    return {
      formTitle: this.isEditMode
        ? 'Update ESI Calculation Month Limit'
        : 'Add ESI Calculation Month Limit',
      maxColsPerRow: 5,
      sections: [
        {
          fields,
        },
      ],
      submitLabel: this.isEditMode ? 'Update' : 'Save',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data) => this.handleSubmit(data),
      onReset: () => this.handleReset(),
      onCancel: () => this.goBack(),
    };
  }

  private handleSubmit(formData: any): void {
    if (!formData) {
      return;
    }

    const branchID = (formData.branchID || '').trim();
    const firstMonth = (formData.firstMonth || '').trim();
    const secondMonth = (formData.secondMonth || '').trim();

    if (!branchID) {
      this.notificationService.showError('Branch is required.');
      return;
    }

    if (!firstMonth) {
      this.notificationService.showError('First month is required.');
      return;
    }

    if (!secondMonth) {
      this.notificationService.showError('Second month is required.');
      return;
    }

    if (firstMonth === secondMonth) {
      this.notificationService.showError('First month and second month cannot be the same.');
      return;
    }

    const newRecord = {
      branchID,
      firstMonth,
      secondMonth,
    };

    // Validate for duplicate records using common function
    const uniqueFields = ['branchID', 'firstMonth', 'secondMonth'];
    const validationResult = UtilityService.validateUniqueRecord(
      this.esiCalculationMonthLimitList,
      newRecord,
      uniqueFields,
      this.isEditMode ? this.esiCalculationMonthLimitId : undefined,
      'esiCalculationMonthLimitID'
    );

    if (!validationResult.isValid) {
      this.notificationService.showError(validationResult.errorMessage);
      return;
    }

    const status = this.isEditMode ? UtilityService.normalizeStatus(formData.status) : 1;
    const payload: esiCalculationMonthLimitDto = {
      branchID,
      firstMonth,
      secondMonth,
      status,
    };

    if (this.isEditMode && this.esiCalculationMonthLimitId) {
      payload.esiCalculationMonthLimitID = this.esiCalculationMonthLimitId;

      // If updating to active status, inactivate all other active records first
      if (status === 1) {
        this.inactivateOtherActiveRecordsForUpdate(this.esiCalculationMonthLimitId).then(() => {
          this.updateRecord(payload);
        }).catch((error) => {
          this.notificationService.showError('Failed to update existing records. Please try again.');
        });
      } else {
        this.updateRecord(payload);
      }
      return;
    }

    // For new records: if status is active (1), inactivate all other active records globally
    if (status === 1) {
      this.inactivateOtherActiveRecords().then(() => {
        this.createNewRecord(payload);
      }).catch((error) => {
        this.notificationService.showError('Failed to update existing records. Please try again.');
      });
    } else {
      this.createNewRecord(payload);
    }
  }

  /**
   * Inactivates all other active records (globally - only one active record allowed at a time)
   */
  private async inactivateOtherActiveRecords(): Promise<void> {
    const recordsToInactivate = UtilityService.findRecordsToInactivate(
      this.esiCalculationMonthLimitList
    );

    // Inactivate all other active records
    const updatePromises = recordsToInactivate.map((record) => {
      const updatePayload: esiCalculationMonthLimitDto = {
        esiCalculationMonthLimitID: record.esiCalculationMonthLimitID,
        branchID: record.branchID,
        firstMonth: record.firstMonth,
        secondMonth: record.secondMonth,
        status: 0, // Inactive
      };
      return firstValueFrom(
        this.service.update('api/Currency/UpdateESICalculationMonthLimit', updatePayload)
      );
    });

    await Promise.all(updatePromises);
  }

  /**
   * Inactivates all other active records when updating (excluding the current record being updated)
   */
  private async inactivateOtherActiveRecordsForUpdate(currentId: string): Promise<void> {
    const recordsToInactivate = UtilityService.findRecordsToInactivate(
      this.esiCalculationMonthLimitList,
      (record) => record.esiCalculationMonthLimitID !== currentId
    );

    // Inactivate all other active records
    const updatePromises = recordsToInactivate.map((record) => {
      const updatePayload: esiCalculationMonthLimitDto = {
        esiCalculationMonthLimitID: record.esiCalculationMonthLimitID,
        branchID: record.branchID,
        firstMonth: record.firstMonth,
        secondMonth: record.secondMonth,
        status: 0, // Inactive
      };
      return firstValueFrom(
        this.service.update('api/Currency/UpdateESICalculationMonthLimit', updatePayload)
      );
    });

    await Promise.all(updatePromises);
  }

  /**
   * Updates an existing ESI Calculation Month Limit record
   */
  private updateRecord(payload: esiCalculationMonthLimitDto): void {
    this.service.update('api/Currency/UpdateESICalculationMonthLimit', payload).subscribe({
      next: () => {
        this.notificationService.showSuccess('Updated Successfully');
        this.navigateToList();
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage =
          error?.error?.message ?? error?.message ?? 'An unexpected error occurred.';
        this.notificationService.showError(errorMessage);
      },
    });
  }

  /**
   * Creates a new ESI Calculation Month Limit record
   */
  private createNewRecord(payload: esiCalculationMonthLimitDto): void {
    this.service.post('api/Currency/CreateESICalculationMonthLimit', payload).subscribe({
      next: () => {
        this.notificationService.showSuccess('Saved Successfully');
        this.navigateToList();
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage =
          error?.error?.message ?? error?.message ?? 'An unexpected error occurred.';
        this.notificationService.showError(errorMessage);
      },
    });
  }

  private handleReset(): void {
    this.setFormConfig({ ...this.initialValues });
  }

  private createEmptyState(): EsiCalculationMonthLimitFormState {
    return {
      branchID: '',
      firstMonth: '',
      secondMonth: '',
      status: '1',
    };
  }

  private createStateFromEsiCalculationMonthLimit(
    data: any
  ): EsiCalculationMonthLimitFormState {
    if (!data) {
      return this.createEmptyState();
    }
    return {
      branchID: data.branchID ?? data.companyBranchId ?? '',
      firstMonth: data.firstMonth ?? '',
      secondMonth: data.secondMonth ?? '',
      status: this.normalizeStatus(data.status),
    };
  }

  private normalizeStatus(status: any): string {
    return UtilityService.normalizeStatus(status).toString();
  }

  private navigateToList(): void {
    this.router.navigate(['/esiCalculationMonthLimit']);
  }

  goBack(): void {
    this.location.back();
  }

}
