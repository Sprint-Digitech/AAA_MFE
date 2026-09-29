import { ChangeDetectorRef, Component, Injectable, OnInit, ViewChild } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { FormConfig, AddUpdateFormComponent } from '@fovestta2/web-angular';
import { AccountService } from '../../shared/services/account.service';
import { DialogService } from '../../shared/services/dialog.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UtilityService } from '../../shared/services/utility.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

@Injectable({
  providedIn: 'root',
})
class SelectedTabService {
  pageSelectedTab = 0;
  constructor() { }
}
@Injectable({
  providedIn: 'root',
})
class ExpandedPanelServiceService {
  expandedPanelIndex = 0;
  constructor() { }
}

interface statutoryDto {
  id?: string;
  companyBranchId?: string;
  companyPanNo: string;
  companyCinNo: string;
  companyPfNo: string;
  companyEsiNo: string;
  companyTanNo: string;
  companyTdsCircle: any;
  companyAoCode: string;
  pfCalculation: any;
  pfOverridableEmployee: any;
  isPfExpensesIncludeInCTC: any;
  isPfExpensesOverridableAtEmployeeLevel: any;
  tradeNumber: string;
  eidNumber: string;
  status: any;
}

interface branchContactDetailsDto {
  id?: string;
  companyBranchId?: string;
  contactPerson: string;
  primaryEmailId: string;
  secondaryEmailId: string;
  primaryMobileNo: string;
  secondaryMobileNo: string;
  status: any;
}

interface companyTaxDeductorDto {
  id?: string;
  taxDeductorName: string;
  taxDeductorFatherName: string;
  taxDeductorDesignation: string;
  taxDeductorMobileNo: string;
  taxDeductorEmailId: string;
  companyBranchId?: string;
  status: any;
}

interface BranchAddressDtoModel {
  id?: string | undefined | null;
  companyBranchId?: string | undefined | null;
  countryId: string; // Required, represents the ID of the selected country
  stateId: string; // Required, represents the ID of the selected state
  cityId: string; // Required, represents the ID of the selected city
  addressLine: string;
  pinCode: string;
  status: any; // Required, represents the status as a numeric value
}

// Contact Interface
interface EmployeeContact {
  employeeContactDetailsId?: string;
  employeeId?: string;
  email: string;
  personalEmailId: string;
  primaryMobileNo: string;
  secondaryMobileNo: string;
  workPhoneNo: string;
  extensionNo: string;
  floorNumber: string;
  seatingType: string;
  remark: string;
  status?: number;
  isModified?: boolean;
}

@Component({
  selector: 'app-branch-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddUpdateFormComponent,
    MatFormFieldModule,
    MatOptionModule,
    MatDialogModule,
    ReactiveFormsModule,
  ],
  templateUrl: './branch-details.component.html',
  styleUrls: ['./branch-details.component.scss'],
})
export class BranchDetailsComponent implements OnInit {
  public branchDetails: any;
  public companyBranchId: any;
  public branchContact: any;
  // Form Configurations
  statutoryFormConfig!: FormConfig;
  taxDeductorFormConfig!: FormConfig;
  addressFormConfig!: FormConfig;
  overtimeFormConfig!: FormConfig;
  contactFormConfig!: FormConfig;
  leaveEncashmentFormConfig!: FormConfig;
  dateTimeFormConfig!: FormConfig;

  // Manual Data Tracking for Fallback (Internal use)
  manualContactData: any = {};
  manualStatutoryData: any = {};
  manualTaxData: any = {};
  manualAddressData: any = {};
  manualOvertimeData: any = {};
  manualLeaveData: any = {};
  manualDateTimeData: any = {};

  addressId: string | undefined;
  contactId: string | undefined;
  statutoryId: string | undefined;
  taxId: string | undefined;
  overtimeId: string | undefined;
  almsOvertimeId: string | null = null;
  cabOvertimeId: string | null = null;
  // OT-hours bank is an ALMS-only table (no HRMSAuthZ/CAB copies to fan out to),
  // so it gets its own id tracking separate from overtimeId/almsOvertimeId/cabOvertimeId above.
  overtimeBankSettingId: string | null = null;
  leaveTypeOptions: { label: string; value: string }[] = [];
  leaveId: string | undefined;
  dateTimeSettingsId: string | undefined;
  isTimezoneCustom: boolean = false;

  addressDataLoaded: boolean = false;
  contactDataLoaded: boolean = false;
  overtimeDataLoaded: boolean = false;
  statutoryDataLoaded: boolean = false;
  taxDataLoaded: boolean = false;
  leaveDataLoaded: boolean = false;
  dateTimeDataLoaded: boolean = false;

  initializeStatutoryConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeStatutoryConfig - v22.4', initialValues);
    this.manualStatutoryData = { ...initialValues };
    const statutoryId = initialValues?.id || initialValues?.Id || initialValues?.companyBranchStatutoryIdentityId;
    this.statutoryId = statutoryId;
    const isUpdate = !!statutoryId;

    this.statutoryFormConfig = {
      formTitle: '',
      submitLabel: isUpdate ? 'Update Details' : 'Save Details',
      maxColsPerRow: 4,
      hideSubmit: false,
      hideCancel: false,
      onSubmit: (data: any) => {
        this.onStatutorySubmit(data, this.statutoryId);
      },
      onCancel: () => {
        this.cancelChanges('statutory');
        this.getBranchStatutory();
      },
      sections: [
        {
          fields: [
            {
              name: 'companyPanNo',
              label: 'PAN No.',
              placeholder: 'e.g. ABCDE1234F',
              type: 'text',
              colSpan: 1,
              value: initialValues?.companyPanNo || '',
              onChange: (val: any) => (this.manualStatutoryData.companyPanNo = val),
              validations: [
                { type: 'required', message: 'Required' },
                {
                  type: 'pattern',
                  value: '^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$',
                  message: 'Invalid PAN',
                },
              ],
            },
            {
              name: 'companyCinNo',
              label: 'CIN No.',
              placeholder: 'e.g. 21 digit CIN',
              type: 'text',
              colSpan: 1,
              value: initialValues?.companyCinNo || '',
              onChange: (val: any) => (this.manualStatutoryData.companyCinNo = val),
              validations: [],
            },
            {
              name: 'companyPfNo',
              label: 'PF No.',
              placeholder: 'e.g. AA/BBB/12345/123/1234567',
              type: 'text',
              colSpan: 1,
              value: initialValues?.companyPfNo || '',
              onChange: (val: any) => (this.manualStatutoryData.companyPfNo = val),
              validations: [],
            },
            {
              name: 'companyEsiNo',
              label: 'ESI No.',
              placeholder: 'e.g. 17 digits',
              type: 'text',
              colSpan: 1,
              value: initialValues?.companyEsiNo || '',
              onChange: (val: any) => (this.manualStatutoryData.companyEsiNo = val),
              validations: [],
            },
            {
              name: 'companyTanNo',
              label: 'TAN No.',
              placeholder: 'e.g. AAAA99999A',
              type: 'text',
              colSpan: 1,
              value: initialValues?.companyTanNo || '',
              onChange: (val: any) => (this.manualStatutoryData.companyTanNo = val),
              validations: [],
            },
            {
              name: 'lwfNo',
              label: 'LWF No.',
              type: 'text',
              colSpan: 1,
              value: initialValues?.lwfNo || '',
              onChange: (val: any) => (this.manualStatutoryData.lwfNo = val),
              validations: [],
            },
            {
              name: 'tradeNo',
              label: 'Trade/Other No.',
              type: 'text',
              colSpan: 1,
              value: initialValues?.tradeNo || '',
              onChange: (val: any) => (this.manualStatutoryData.tradeNo = val),
              validations: [],
            },
            {
              name: 'pfCalculation',
              label: 'PF Calculate On',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Max Limit as per Act', value: 'Max Limit as per Act' },
                { label: 'Full', value: 'Full' },
              ],
              value: initialValues?.pfCalculation || 'Max Limit as per Act',
              onChange: (val: any) => (this.manualStatutoryData.pfCalculation = val),
              colSpan: 2,
            },
            {
              name: 'pfCalculationBasis',
              label: 'PF Calculation Basis',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Basic', value: 'Basic' },
                { label: 'Gross Earning', value: 'GrossEarning' },
              ],
              value: initialValues?.pfCalculationBasis || 'Basic',
              onChange: (val: any) => (this.manualStatutoryData.pfCalculationBasis = val),
              colSpan: 2,
            },
            {
              name: 'pfOverridableEmployee',
              label: 'Is PF Overridable at Emp Level',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.pfOverridableEmployee || 'Yes',
              onChange: (val: any) =>
                (this.manualStatutoryData.pfOverridableEmployee = val),
              colSpan: 2,
            },
            {
              name: 'pfCeilingProrateByAttendance',
              label: 'Prorate PF Ceiling by Attendance',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.pfCeilingProrateByAttendance || 'No',
              onChange: (val: any) =>
                (this.manualStatutoryData.pfCeilingProrateByAttendance = val),
              colSpan: 2,
            },
            {
              name: 'isPfExpensesIncludeInCTC',
              label: 'Is PF Expenses include in CTC',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.isPfExpensesIncludeInCTC || 'Yes',
              onChange: (val: any) =>
                (this.manualStatutoryData.isPfExpensesIncludeInCTC = val),
              colSpan: 2,
            },
            {
              name: 'isPfExpensesOverridableAtEmployeeLevel',
              label: 'Is PF Expense Overridable at Emp level',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value:
                initialValues?.isPfExpensesOverridableAtEmployeeLevel || 'Yes',
              onChange: (val: any) =>
              (this.manualStatutoryData.isPfExpensesOverridableAtEmployeeLevel =
                val),
              colSpan: 2,
            },
            {
              name: 'isEsiIncludeInCTC',
              label: 'Is ESI Include In CTC',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.isEsiIncludeInCTC || 'Yes',
              onChange: (val: any) => (this.manualStatutoryData.isEsiIncludeInCTC = val),
              colSpan: 2,
            },
            {
              name: 'isEsiOverridableAtEmployeeLevel',
              label: 'Is ESI Overridable at Emp level',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.isEsiOverridableAtEmployeeLevel || 'Yes',
              onChange: (val: any) =>
                (this.manualStatutoryData.isEsiOverridableAtEmployeeLevel = val),
              colSpan: 2,
            },
            {
              name: 'isLwfIncludeInCTC',
              label: 'Is LWF include in CTC',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.isLwfIncludeInCTC || 'Yes',
              onChange: (val: any) => (this.manualStatutoryData.isLwfIncludeInCTC = val),
              colSpan: 2,
            },
            {
              name: 'isLwfOverridableAtEmployeeLevel',
              label: 'Is LWF Overridable at Emp Level',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.isLwfOverridableAtEmployeeLevel || 'Yes',
              onChange: (val: any) =>
                (this.manualStatutoryData.isLwfOverridableAtEmployeeLevel = val),
              colSpan: 2,
            },
            {
              name: 'isGratuityIncludeInCTC',
              label: 'Is Gratuity Include in CTC',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.isGratuityIncludeInCTC || 'Yes',
              onChange: (val: any) =>
                (this.manualStatutoryData.isGratuityIncludeInCTC = val),
              colSpan: 1,
            },
            {
              name: 'isAdminChargesIncludeInCTC',
              label: 'Is Admin Charge Include in CTC',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ],
              value: initialValues?.isAdminChargesIncludeInCTC || 'Yes',
              onChange: (val: any) =>
                (this.manualStatutoryData.isAdminChargesIncludeInCTC = val),
              colSpan: 1,
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ],
              value:
                initialValues?.status !== undefined
                  ? UtilityService.normalizeStatus(initialValues.status)
                  : 1,
              onChange: (val: any) => (this.manualStatutoryData.status = val),
              colSpan: 2,
            },
          ],
        },
      ],
    };
  }


  public updatedStatutoryFormConfig: boolean = false;

  // Tax Deductor FormConfig
  initializeTaxFormConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeTaxFormConfig - v22.4', initialValues);
    this.manualTaxData = { ...initialValues };
    const taxId = initialValues?.id || initialValues?.Id || initialValues?.companyTaxDeductorDetailId;
    this.taxId = taxId;
    const isUpdate = !!taxId;

    this.taxDeductorFormConfig = {
      formTitle: '',
      submitLabel: isUpdate ? 'Update Details' : 'Save Details',
      maxColsPerRow: 2,
      hideSubmit: false,
      hideCancel: false,
      onSubmit: (data: any) => {
        this.onTaxDeductorSubmit(data, this.taxId);
      },
      onCancel: () => {
        this.getTaxDeductor();
      },
      sections: [
        {
          fields: [
            {
              name: 'taxDeductorName',
              label: 'Tax Deductor Name',
              type: 'text',
              colSpan: 1,
              value: initialValues?.taxDeductorName || '',
              onChange: (val: any) => (this.manualTaxData.taxDeductorName = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'fatherName',
              label: 'Father Name',
              type: 'text',
              colSpan: 1,
              value: initialValues?.fatherName || '',
              onChange: (val: any) => (this.manualTaxData.fatherName = val),
              validations: [],
            },
            {
              name: 'designation',
              label: 'Designation',
              type: 'text',
              colSpan: 1,
              value: initialValues?.designation || '',
              onChange: (val: any) => (this.manualTaxData.designation = val),
              validations: [],
            },
            {
              name: 'aoCode',
              label: 'AO Code',
              type: 'text',
              colSpan: 1,
              value: initialValues?.aoCode || '',
              onChange: (val: any) => (this.manualTaxData.aoCode = val),
              validations: [],
            },
            {
              name: 'tdsCircle',
              label: 'TDS Circle',
              type: 'text',
              colSpan: 1,
              value: initialValues?.tdsCircle || '',
              onChange: (val: any) => (this.manualTaxData.tdsCircle = val),
              validations: [],
            },
            {
              name: 'taxDeductorMobileNo',
              label: 'Mobile No.',
              type: 'text',
              colSpan: 1,
              value: initialValues?.taxDeductorMobileNo || '',
              onChange: (val: any) =>
                (this.manualTaxData.taxDeductorMobileNo = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'taxDeductorEmailId',
              label: 'Email',
              type: 'email',
              colSpan: 1,
              value: initialValues?.taxDeductorEmailId || '',
              onChange: (val: any) => (this.manualTaxData.taxDeductorEmailId = val),
              validations: [],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ],
              value:
                initialValues?.status !== undefined
                  ? UtilityService.normalizeStatus(initialValues.status)
                  : 1,
              onChange: (val: any) => (this.manualTaxData.status = val),
              colSpan: 2,
            },
          ],
        },
      ],
    };
  }


  // Leave Encashment FormConfig


  initializeLeaveFormConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeLeaveFormConfig - v22.4', initialValues);
    this.manualLeaveData = { ...initialValues };
    const leaveId = initialValues?.id || initialValues?.Id || initialValues?.branchLeaveId;
    this.leaveId = leaveId;
    const isUpdate = !!leaveId;

    this.leaveEncashmentFormConfig = {
      formTitle: '',
      submitLabel: isUpdate ? 'Update Details' : 'Save Details',
      maxColsPerRow: 2,
      hideSubmit: false,
      hideCancel: false,
      onSubmit: (data: any) => {
        this.onLeaveEncashmentSubmit(data, this.leaveId);
      },
      onCancel: () => {
        this.getLeaveEncashment();
      },
      sections: [
        {
          fields: [
            {
              name: 'maxEncashmentDays',
              label: 'Max Encashment Days',
              type: 'number',
              colSpan: 1,
              value: initialValues?.maxEncashmentDays || '',
              onChange: (val: any) => (this.manualLeaveData.maxEncashmentDays = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'minLeaveBalance',
              label: 'Min Leave Balance',
              type: 'number',
              colSpan: 1,
              value: initialValues?.minLeaveBalance || '',
              onChange: (val: any) => (this.manualLeaveData.minLeaveBalance = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'taxExemptionLimit',
              label: 'Tax Exemption Limit',
              type: 'number',
              colSpan: 1,
              value: initialValues?.taxExemptionLimit || '',
              onChange: (val: any) => (this.manualLeaveData.taxExemptionLimit = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'tdsRate',
              label: 'TDS Rate (%)',
              type: 'number',
              colSpan: 1,
              value: initialValues?.tdsRate || '',
              onChange: (val: any) => (this.manualLeaveData.tdsRate = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ],
              value:
                initialValues?.status !== undefined
                  ? UtilityService.normalizeStatus(initialValues.status)
                  : 1,
              onChange: (val: any) => (this.manualLeaveData.status = val),
              colSpan: 2,
            },
          ],
        },
      ],
    };
  }

  // Date & Time Settings FormConfig - branch-scoped (moved here from company settings).
  // The timezone is auto-derived server-side from the branch's address (country/state)
  // whenever the branch has no explicit override - see getBranchDateTimeSettings() below
  // for how that's surfaced, and onDateTimeFormSubmit() for how a save marks it custom.
  static readonly TIMEZONE_OPTIONS = [
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
    { label: 'Asia/Kolkata (India, UTC+5:30)', value: 'Asia/Kolkata' },
    { label: 'Asia/Dubai (UAE, UTC+4:00)', value: 'Asia/Dubai' },
    { label: 'Asia/Riyadh (Saudi Arabia, UTC+3:00)', value: 'Asia/Riyadh' },
    { label: 'Asia/Singapore (UTC+8:00)', value: 'Asia/Singapore' },
    { label: 'Asia/Kuala_Lumpur (Malaysia, UTC+8:00)', value: 'Asia/Kuala_Lumpur' },
    { label: 'Asia/Bangkok (Thailand, UTC+7:00)', value: 'Asia/Bangkok' },
    { label: 'Asia/Dhaka (Bangladesh, UTC+6:00)', value: 'Asia/Dhaka' },
    { label: 'Asia/Shanghai (China, UTC+8:00)', value: 'Asia/Shanghai' },
    { label: 'Asia/Tokyo (Japan, UTC+9:00)', value: 'Asia/Tokyo' },
    { label: 'Europe/London (UK, UTC+0:00)', value: 'Europe/London' },
    { label: 'Europe/Berlin (Germany, UTC+1:00)', value: 'Europe/Berlin' },
    { label: 'Europe/Paris (France, UTC+1:00)', value: 'Europe/Paris' },
    { label: 'America/New_York (US Eastern)', value: 'America/New_York' },
    { label: 'America/Chicago (US Central)', value: 'America/Chicago' },
    { label: 'America/Denver (US Mountain)', value: 'America/Denver' },
    { label: 'America/Los_Angeles (US Pacific)', value: 'America/Los_Angeles' },
    { label: 'America/Anchorage (US Alaska)', value: 'America/Anchorage' },
    { label: 'Pacific/Honolulu (US Hawaii)', value: 'Pacific/Honolulu' },
    { label: 'America/Toronto (Canada Eastern)', value: 'America/Toronto' },
    { label: 'America/Vancouver (Canada Pacific)', value: 'America/Vancouver' },
    { label: 'Australia/Sydney (UTC+10:00/11:00)', value: 'Australia/Sydney' },
    { label: 'Australia/Perth (UTC+8:00)', value: 'Australia/Perth' },
    { label: 'Africa/Johannesburg (UTC+2:00)', value: 'Africa/Johannesburg' },
    { label: 'Africa/Cairo (UTC+2:00)', value: 'Africa/Cairo' },
    { label: 'Pacific/Auckland (New Zealand)', value: 'Pacific/Auckland' },
  ];

  initializeDateTimeConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeDateTimeConfig', initialValues);
    const settingsId = initialValues?.companySettingsId;
    this.dateTimeSettingsId = settingsId || undefined;
    this.isTimezoneCustom = !!initialValues?.isTimezoneCustom;
    const isUpdate = !!settingsId;

    this.manualDateTimeData = {
      dateFormat: initialValues?.dateFormat || 'dd-MM-yyyy',
      dateSeparator: initialValues?.dateSeparator || '-',
      timeFormat: initialValues?.timeFormat || 'HH:mm',
      timeDisplayFormat: initialValues?.timeDisplayFormat || 'HH:mm',
      timezone: initialValues?.timezone || 'UTC',
      adjustForDST: !!initialValues?.adjustForDST,
    };

    this.dateTimeFormConfig = {
      formTitle: '',
      submitLabel: isUpdate ? 'Update Details' : 'Save Details',
      maxColsPerRow: 2,
      hideSubmit: false,
      hideCancel: false,
      onSubmit: (data: any) => {
        this.onDateTimeFormSubmit(data, this.dateTimeSettingsId);
      },
      onCancel: () => {
        this.getBranchDateTimeSettings();
      },
      sections: [
        {
          fields: [
            {
              name: 'timezone',
              label: this.isTimezoneCustom
                ? 'Timezone'
                : 'Timezone (auto-detected from branch address - not yet overridden)',
              type: 'select',
              colSpan: 2,
              options: BranchDetailsComponent.TIMEZONE_OPTIONS,
              value: initialValues?.timezone || 'UTC',
              onChange: (val: any) => (this.manualDateTimeData.timezone = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'dateFormat',
              label: 'Date Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'DD/MM/YYYY', value: 'dd/MM/yyyy' },
                { label: 'MM/DD/YYYY', value: 'MM/dd/yyyy' },
                { label: 'YYYY/MM/DD', value: 'yyyy/MM/dd' },
                { label: 'DD-MM-YYYY', value: 'dd-MM-yyyy' },
                { label: 'DD.MM.YYYY', value: 'dd.MM.yyyy' },
              ],
              value: initialValues?.dateFormat || 'dd-MM-yyyy',
              onChange: (val: any) => (this.manualDateTimeData.dateFormat = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'dateSeparator',
              label: 'Date Field Separator',
              type: 'select',
              colSpan: 1,
              options: [
                { label: '/', value: '/' },
                { label: '-', value: '-' },
                { label: '.', value: '.' },
              ],
              value: initialValues?.dateSeparator || '-',
              onChange: (val: any) => (this.manualDateTimeData.dateSeparator = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'timeFormat',
              label: 'Time Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: '12-hour', value: '12-hour' },
                { label: '24-hour', value: '24-hour' },
              ],
              value: initialValues?.timeFormat || '24-hour',
              onChange: (val: any) => (this.manualDateTimeData.timeFormat = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'timeDisplayFormat',
              label: 'Time Display Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'Hours:Minutes:Seconds', value: 'HH:mm:ss' },
                { label: 'Hours:Minutes', value: 'HH:mm' },
              ],
              value: initialValues?.timeDisplayFormat || 'HH:mm',
              onChange: (val: any) => (this.manualDateTimeData.timeDisplayFormat = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'adjustForDST',
              label: 'Adjust DST',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 2,
              value: initialValues?.adjustForDST ? 'true' : 'false',
              options: [
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ],
              onChange: (val: any) =>
                (this.manualDateTimeData.adjustForDST = val === 'true'),
              validations: [{ type: 'required', message: 'Required' }],
            },
          ],
        },
      ],
    };
  }

  getBranchDateTimeSettings() {
    if (!this.companyBranchId && this.route.snapshot.params['id']) {
      this.companyBranchId = this.route.snapshot.params['id'];
    }

    this.dateTimeDataLoaded = false;

    this.reposotory
      .get(`api/company-branch/GetCompanySettingst?companyBranchId=${this.companyBranchId}`)
      .subscribe({
        next: (data: any) => {
          const settings = Array.isArray(data) && data.length > 0 ? data[0] : null;
          this.initializeDateTimeConfig(settings);
          this.dateTimeDataLoaded = true;
        },
        error: () => {
          this.notificationService.showError('Error loading date & time settings');
          this.initializeDateTimeConfig(null);
          this.dateTimeDataLoaded = true;
        },
      });
  }

  onDateTimeFormSubmit(data: any, id?: any) {
    const payload: any = {
      CompanySettingsId: id || this.dateTimeSettingsId || undefined,
      CompanyBranchID: this.companyBranchId,
      DateFormat: data.dateFormat,
      DateSeparator: data.dateSeparator,
      TimeFormat: data.timeFormat,
      TimeDisplayFormat: data.timeDisplayFormat,
      Timezone: data.timezone,
      AdjustForDST: data.adjustForDST === 'true' || data.adjustForDST === true,
    };

    const isUpdate = !!payload.CompanySettingsId;
    const apiCall = isUpdate
      ? this.reposotory.update('api/company-branch/UpdateCompanySettingst', payload)
      : this.reposotory.post('api/company-branch/CreateCompanySettingst', payload);

    apiCall.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `Date & Time settings ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        this.getBranchDateTimeSettings();
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.showError(
          err.error?.message || 'Error saving date & time settings',
        );
      },
    });
  }

  // Helper method to safely convert value to string and trim
  safeTrim(value: any): string {
    return String(value || '').trim();
  }

  // Helper method to check if value is empty after trimming
  isEmpty(value: any): boolean {
    return !String(value || '').trim();
  }

  public branchAddress: any;
  public branchAddressId: any;
  selectedIndex = 0;
  public dataSource: any[] = [];
  public branchContactList: any[] = [];
  onBranchContactDelete: boolean = true;
  onBranchContactDetails: boolean = false;
  contactData: any;

  public columns = [
    { field: 'srNo', header: '#' },
    { field: 'contactPerson', header: 'Contact Person' },
    { field: 'primaryEmailId', header: 'Primary Email' },
    { field: 'secondaryEmailId', header: 'Secondary Email' },
    { field: 'primaryMobileNo', header: 'Primary Mobile' },
    { field: 'secondaryMobileNo', header: 'Secondary Mobile' },
    { field: 'status', header: 'Status' },
  ];
  public dataSource1: any[] = [];
  public branchStatutoryList: any[] = [];
  public displayColumn1 = [
    { field: 'srNo', header: '#' },
    { field: 'companyPanNo', header: ' PAN No.' },
    { field: 'companyCinNo', header: '  CIN No.' },
    { field: 'companyPfNo', header: ' PF No.' },
    { field: 'pfCalculation', header: 'PF Calculate On' },
    { field: 'pfCalculationBasis', header: 'PF Calculation Basis' },
    {
      field: 'pfOverridableEmployee',
      header: 'PF Overridable At Employee Level',
    },
    {
      field: 'isPfExpensesIncludeInCTC',
      header: ' Is PF Expenses Include In CTC',
    },
    {
      field: 'isPfExpensesOverridableAtEmployeeLevel',
      header: ' Is PF Expenses Overridable At Employee Level',
    },
    { field: 'companyEsiNo', header: ' ESI No.' },
    { field: 'companyTanNo', header: 'Tan No.' },
    { field: 'companyTdsCircle', header: 'Tds Circle No.' },
    { field: 'companyAoCode', header: 'AOCode' },
    { field: 'status', header: 'Status' },
  ];
  public dataSource2: any[] = [];
  public branchTaxList: any[] = [];
  onBranchTaxtDelete: boolean = true;

  public displayColumn2 = [
    { field: 'srNo', header: '#' },
    { field: 'taxDeductorName', header: ' Tax Deductor Name' },
    { field: 'taxDeductorFatherName', header: 'Father Name' },
    { field: 'taxDeductorDesignation', header: 'Designation' },
    { field: 'taxDeductorMobileNo', header: 'Mobile No.' },
    { field: 'taxDeductorEmailId', header: 'Email' },
    { field: 'status', header: 'Status' },
  ];

  public displayColumn4 = [
    { field: 'otDailyLimit', header: 'Ot Daily Limit' },
    { field: 'otWeeklyLimit', header: 'Ot Weekly Limit' },
    { field: 'otMonthlyLimit', header: 'Ot Monthly Limit' },
    { field: 'otQuarterlyLimit', header: 'Ot Quartely Limit' },
    { field: 'otAnuualyLimit', header: 'Ot Annually Limit' },
    { field: 'normalOTRate', header: 'Normal Ot Rate' },
    { field: 'normalOTRateMultiplierBase', header: 'Normal Rate Multiplier' },
    { field: 'holidayOTRate', header: 'Holiday OT Rate' },
    { field: 'holidayOTRateMultiplierBase', header: 'Holiday Rate Multiplier' },
    { field: 'bookKeeping', header: 'Bookkeeping' },
    { field: 'status', header: 'Status' },
  ];

  public displayColumn5 = [
    { field: 'maxEncashmentDays', header: 'Max Encashment Days Per Year' },
    { field: 'minLeaveBalance', header: 'Min Leave Balance After Encashment' },
    { field: 'taxExemptionLimit', header: 'Tax Exemption Limit' },
    { field: 'tdsRate', header: 'TDS Rate' },
    { field: 'remark', header: 'Remarks' },
    { field: 'status', header: 'Status' },
  ];
  public displayColumn6 = [
    { field: 'dayName', header: 'Day Name' },
    { field: 'isWeeklyOff', header: 'Is Weekly Off' },
    { field: 'status', header: 'Status' },
  ];

  public dataSource5: any[] = [];
  public dataSource6: any[] = [];
  public branchLeaveEncashmentList: any[] = [];
  public branchWeeklyOffList: any[] = [];
  showContactForm: boolean = false;

  @ViewChild('paginatorBranchContact') paginatorBranchContact!: MatPaginator;
  @ViewChild('paginatorBranchStatutory')
  paginatorBranchStatutory!: MatPaginator;

  @ViewChild(MatSort) sort!: MatSort;
  companyId: any;
  details: any;
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  id: any;
  mobileErrors: any = {
    contact: [],
    tax: [],
  };
  emailErrors: any = {
    contact: [],
    tax: [],
  };
  public employeeList: any[] = [];

  constructor(

    private reposotory: AccountService,
    private dialogService: DialogService,
    public selectedTab: SelectedTabService,
    private dialogForm: MatDialog,
    private expandedPanelService: ExpandedPanelServiceService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  tabChanged(event: MatTabChangeEvent) {
    this.selectedTab.pageSelectedTab = event.index;
  }
  get statutory(): any {
    return this.dataSource1?.[0] || {};
  }
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.companyId = params['companyId'];
      this.companyBranchId = params['id']; // The branch ID is passed as 'id' in the route
      this.id = params['id'];
      this.branchAddressId = params['id'];
    });
    console.log('[BRANCH_DETAILS] ngOnInit - Version 2026-03-06.5 - Params:', {
      companyId: this.companyId,
      companyBranchId: this.companyBranchId,
      id: this.id
    });

    this.onBranchContactDelete = true;
    this.onBranchContactDetails = false;
    this.fetchCountries();
    this.getBranchDetails();
    this.getBranchContact();
    this.getBranchAddress();
    this.getBranchStatutory();
    this.getDetails();
    this.getTaxDeductor();
    this.getLeaveEncashment();
    this.getEmployeeList();
    this.selectedIndex = this.selectedTab.pageSelectedTab;
    if (this.expandedPanelService.expandedPanelIndex !== null) {
      this.expandedPanelIndex = this.expandedPanelService.expandedPanelIndex;
    }
  }




  initializeAddressConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeAddressConfig - v22.4', initialValues);
    const addressId = initialValues?.id || initialValues?.Id || initialValues?.addressID;
    this.addressId = addressId;
    const isUpdate = !!addressId;

    this.manualAddressData = { ...initialValues };
    this.addressFormConfig = {
      formTitle: '',
      submitLabel: isUpdate ? 'Update Details' : 'Save Details',
      maxColsPerRow: 2,
      hideSubmit: false,
      hideCancel: false,
      onSubmit: (data: any) => {
        this.onAddressFormSubmit(data, this.addressId);
      },
      onCancel: () => {
        this.getBranchAddress();
      },
      sections: [
        {
          fields: [
            {
              name: 'countryId',
              label: 'Country',
              type: 'select',
              colSpan: 1,
              options: this.countries.map((c: any) => ({
                label: c.locationName,
                value: c.id,
              })),
              value: initialValues?.countryId || '',
              onChange: (val: any, form: FormGroup) => {
                this.manualAddressData.countryId = val;
                this.onCountryChangeLib(val, form);
              },
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'stateId',
              label: 'State',
              type: 'select',
              colSpan: 1,
              options: [],
              value: initialValues?.stateId || '',
              onChange: (val: any, form: FormGroup) => {
                this.manualAddressData.stateId = val;
                this.onStateChangeLib(val, form);
              },
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'cityId',
              label: 'City',
              type: 'select',
              colSpan: 1,
              options: [],
              value: initialValues?.cityId || '',
              onChange: (val: any) => (this.manualAddressData.cityId = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'addressLine',
              label: 'AddressLine',
              type: 'text',
              colSpan: 2,
              value: initialValues?.addressLine || '',
              onChange: (val: any) => (this.manualAddressData.addressLine = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'pinCode',
              label: 'Pincode',
              type: 'number',
              colSpan: 1,
              value: initialValues?.pinCode || '',
              onChange: (val: any) => (this.manualAddressData.pinCode = val),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ],
              value:
                initialValues?.status !== undefined
                  ? UtilityService.normalizeStatus(initialValues.status)
                  : 1,
              onChange: (val: any) => (this.manualAddressData.status = val),
              colSpan: 2,
            },
          ],
        },
      ],
    };
  }

  fetchCountries(): void {
    // NEW API: Fetch Countries (No parentId, level = "country")
    this.reposotory.get('api/ReferenceData/GetLocations?level=country').subscribe({
      next: (data: any[]) => {
        // Filter for active status (status === 1)
        this.countries = data.filter((item) => item.status === 1);

        if (this.addressFormConfig && this.addressFormConfig.sections) {
          const countryOptions = this.countries.map((c) => ({
            label: c.locationName,
            value: c.id,
          }));
          this.updateConfigOptions('countryId', countryOptions);
        }
      },
      error: () =>
        this.notificationService.showError('Failed to load countries'),
    });
  }

  // --- Cascading Handlers ---
  onCountryChangeLib(countryId: string, form: FormGroup) {
    // 1. Save the selected country to the config so it doesn't get erased on refresh
    this.updateConfigValue('countryId', countryId);

    // 2. Reset dependent fields in both Form and Config
    form.patchValue({ stateId: '', cityId: '' });
    this.updateConfigValue('stateId', '');
    this.updateConfigValue('cityId', '');

    // 3. Clear old options
    this.updateConfigOptions('stateId', []);
    this.updateConfigOptions('cityId', []);

    // 4. Load new States
    if (countryId) {
      this.loadStatesForConfig(countryId);
    }
  }

  onStateChangeLib(stateId: string, form: FormGroup) {
    // 1. Save the selected state to the config
    this.updateConfigValue('stateId', stateId);

    // 2. Reset dependent City field
    form.patchValue({ cityId: '' });
    this.updateConfigValue('cityId', '');

    // 3. Load new Cities
    if (stateId) {
      this.loadCitiesForConfig(stateId);
    }
  }

  updateConfigValue(fieldName: string, value: any) {
    if (!this.addressFormConfig?.sections) return;
    const field = this.addressFormConfig.sections[0].fields.find(
      (f) => f.name === fieldName,
    );
    if (field) {
      field.value = value;
    }
  }

  // EXISTING HELPER: Updated to safely trigger change detection
  updateConfigOptions(fieldName: string, options: any[]) {
    if (!this.addressFormConfig?.sections) return;

    const field = this.addressFormConfig.sections[0].fields.find(
      (f) => f.name === fieldName,
    );
    if (field) {
      field.options = options;
      // Re-assign config to trigger Angular UI update
      this.addressFormConfig = { ...this.addressFormConfig };
    }
  }

  // --- API Helpers for Dropdowns ---

  loadStatesForConfig(countryId: string, preselectStateId?: string) {
    this.reposotory
      .get(
        `api/ReferenceData/GetLocations?parentId=${countryId}&level=state`,
      )
      .subscribe((data: any[]) => {
        const activeStates = data.filter(
          (s) => s.status === 1 || s.id === preselectStateId,
        );
        const options = activeStates.map((s) => ({
          label: s.locationName,
          value: s.id,
        }));

        this.updateConfigOptions('stateId', options);

        // --- ADD THIS FIX ---
        // If we have a ViewChild reference to the form, we should trigger validation here.
        // Otherwise, Angular Change Detection should pick it up if we spread the config:
        this.addressFormConfig = { ...this.addressFormConfig };

        if (preselectStateId) {
          this.loadCitiesForConfig(preselectStateId);
        }
      });
  }

  loadCitiesForConfig(stateId: string) {
    // NEW API: Fetch Cities (parentId = stateId, level = "city")
    this.reposotory
      .get(`api/ReferenceData/GetLocations?parentId=${stateId}&level=city`)
      .subscribe((data: any[]) => {
        const activeCities = data.filter((c) => c.status === 1);
        const options = activeCities.map((c) => ({
          label: c.locationName,
          value: c.id,
        }));

        this.updateConfigOptions('cityId', options);
      });
  }

  // ---------------------------------------------------------
  // 2. DATA FETCHING (Refactored)
  // ---------------------------------------------------------

  getBranchAddress = () => {
    if (!this.id && this.route.snapshot.params['id']) {
      this.id = this.route.snapshot.params['id'];
    }

    this.addressDataLoaded = false;

    this.reposotory
      .get(
        `api/company-branch/GetCompanyBranchAddress?companyBranchId=${this.id}`,
      )
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            // --- EDIT MODE ---
            const address = data[0];

            // 1. Initialize config with values (dropdowns will be empty initially)
            this.initializeAddressConfig(address);

            // 2. Fetch States immediately
            if (address.countryId) {
              this.reposotory
                .get(
                  `api/ReferenceData/GetLocations?parentId=${address.countryId}&level=state`,
                )
                .subscribe((stateData: any[]) => {
                  const stateOptions = stateData
                    .filter((s) => s.status === 1 || s.id === address.stateId)
                    .map((s) => ({ label: s.locationName, value: s.id }));
                  this.updateConfigOptions('stateId', stateOptions);

                  // 3. Fetch Cities immediately after States
                  if (address.stateId) {
                    this.reposotory
                      .get(
                        `api/ReferenceData/GetLocations?parentId=${address.stateId}&level=city`,
                      )
                      .subscribe((cityData: any[]) => {
                        const cityOptions = cityData
                          .filter(
                            (c) => c.status === 1 || c.id === address.cityId,
                          )
                          .map((c) => ({ label: c.locationName, value: c.id }));
                        this.updateConfigOptions('cityId', cityOptions);

                        // 4. Show the form ONLY after all data is loaded
                        this.addressDataLoaded = true;
                      });
                  } else {
                    this.addressDataLoaded = true;
                  }
                });
            } else {
              this.addressDataLoaded = true;
            }
          } else {
            // --- ADD MODE ---
            this.initializeAddressConfig(null);
            this.addressDataLoaded = true;
          }
        },
        error: () => {
          this.notificationService.showError('Error loading address');
          this.initializeAddressConfig(null);
          this.addressDataLoaded = true;
        },
      });
  };

  // ---------------------------------------------------------
  // 3. SUBMIT LOGIC
  // ---------------------------------------------------------

  onAddressFormSubmit(data: any, id?: any) {
    console.log('[BRANCH_DETAILS] onAddressFormSubmit started. ID:', id, 'Data:', data);
    const payload: any = {
      CompanyBranchId: this.companyBranchId,
      Id: id || this.addressId || undefined,
      CountryId: data.countryId,
      StateId: data.stateId,
      CityId: data.cityId,
      AddressLine: String(data.addressLine || '').trim(),
      PinCode: String(data.pinCode || '').trim(),
      Status: UtilityService.normalizeStatus(data.status),
    };

    const isUpdate = !!payload.Id;
    console.log('[BRANCH_DETAILS] Address Payload (PascalCase):', payload);
    const apiCall = isUpdate
      ? this.reposotory.update(
        'api/company-branch/UpdateCompanyBranchAddress',
        payload,
      )
      : this.reposotory.post(
        'api/company-branch/CreateCompanyBranchAddress',
        payload,
      );

    apiCall.subscribe({
      next: (res) => {
        console.log('[BRANCH_DETAILS] API Success:', res);
        this.notificationService.showSuccess(
          `Address ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        this.getBranchAddress(); // Refresh
      },
      error: (err: HttpErrorResponse) => {
        console.error('[BRANCH_DETAILS] API Error:', err);
        this.notificationService.showError(
          err.error?.message || 'Error saving address',
        );
      },
    });
  }

  initializeOvertimeConfig(initialValues?: any, otBankValues?: any) {
    console.log('[BRANCH_DETAILS] initializeOvertimeConfig - Raw Data:', initialValues, otBankValues);
    const otId = initialValues?.branchOvertimeSettingID || initialValues?.BranchOvertimeSettingID || initialValues?.id || initialValues?.Id;
    this.overtimeId = otId || null;
    // Seed manualOvertimeData with API values; onChange handlers keep it in sync
    this.manualOvertimeData = {
      otDailyLimit: initialValues?.otDailyLimit ?? '',
      otWeeklyLimit: initialValues?.otWeeklyLimit ?? '',
      otMonthlyLimit: initialValues?.otMonthlyLimit ?? '',
      otQuarterlyLimit: initialValues?.otQuarterlyLimit ?? '',
      otAnuualyLimit: initialValues?.otAnuualyLimit ?? '',
      overTimeWorkingDay: initialValues?.overTimeWorkingDay ?? '',
      normalOTRate: initialValues?.normalOTRate ?? '',
      holidayOTRate: initialValues?.holidayOTRate ?? '',
      otRateBasis: initialValues?.normalOTRateMultiplierBase === 'Gross' ? 'Gross' : 'BasicDA',
      overtimeConfiguration: initialValues?.branchOTHoursRule ?? '',
      workkingHours: initialValues?.workkingHours ?? '',
      status: String(UtilityService.normalizeStatus(initialValues?.status)),
      // Fixed + Dynamic OT (manufacturing use case). isOvertimeAllowed/
      // isDynamicOTAllowed default true so a first-time save of an existing
      // branch's settings doesn't accidentally turn its OT off.
      isOvertimeAllowed: initialValues?.isOvertimeAllowed ?? true,
      isFixedOTAllowed: initialValues?.isFixedOTAllowed ?? false,
      fixedOTDailyHours: initialValues?.fixedOTDailyHours ?? '',
      fixedOTRate: initialValues?.fixedOTRate ?? '',
      fixedOTRateBasis: initialValues?.fixedOTRateMultiplierBase === 'Gross' ? 'Gross' : 'BasicDA',
      isDynamicOTAllowed: initialValues?.isDynamicOTAllowed ?? true,
      // OT-hours bank (Feature 1) - a separate ALMS-only setting, seeded from its
      // own fetch (otBankValues) rather than initialValues (BranchOvertimeSetting).
      isOvertimeBankEnabled: otBankValues?.isEnabled ?? false,
      halfDayHoursThreshold: otBankValues?.halfDayHoursThreshold ?? '',
      fullDayHoursThreshold: otBankValues?.fullDayHoursThreshold ?? '',
      maxBalanceHours: otBankValues?.maxBalanceHours ?? '',
      otBankRedemptionRequiresApproval: otBankValues?.redemptionRequiresApproval ?? true,
      dispositionMode: otBankValues?.dispositionMode || 'CarryForwardMonth',
      carryForwardMaxHours: otBankValues?.carryForwardMaxHours ?? '',
      otRedemptionLeaveTypeMasterId: otBankValues?.otRedemptionLeaveTypeMasterId || otBankValues?.OtRedemptionLeaveTypeMasterId || '',
    };
    const isUpdate = !!otId;

    // Use normalizeStatus for reliable 1/0 mapping
    const currentStatus = UtilityService.normalizeStatus(initialValues?.status);
    console.log('[BRANCH_DETAILS] Overtime ID:', otId, 'isUpdate:', isUpdate, 'Normalized Status:', currentStatus);

    this.overtimeFormConfig = {
      formTitle: '',
      maxColsPerRow: 4,
      hideSubmit: true,
      hideCancel: true,
      onSubmit: (data: any) => {
        this.onOvertimeFormSubmit(data, this.overtimeId);
      },
      onCancel: () => {
        this.getBranchOT();
      },
      sections: [
        {
          title: 'Overtime Limits (Hours)',
          fields: [
            {
              name: 'otDailyLimit',
              label: 'Daily Limit',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g. 4 (hours)',
              value: initialValues?.otDailyLimit ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.otDailyLimit = val; },
            },
            {
              name: 'otWeeklyLimit',
              label: 'Weekly Limit',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g. 20 (hours)',
              value: initialValues?.otWeeklyLimit ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.otWeeklyLimit = val; },
            },
            {
              name: 'otMonthlyLimit',
              label: 'Monthly Limit',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g. 80 (hours)',
              value: initialValues?.otMonthlyLimit ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.otMonthlyLimit = val; },
            },
            {
              name: 'otQuarterlyLimit',
              label: 'Quarterly Limit',
              type: 'number',
              placeholder: 'e.g. 240 (hours)',
              colSpan: 1,
              value: initialValues?.otQuarterlyLimit ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.otQuarterlyLimit = val; },
            },
            {
              name: 'otAnuualyLimit',
              label: 'Annual Limit',
              type: 'number',
              placeholder: 'e.g. 960 (hours)',
              colSpan: 1,
              value: initialValues?.otAnuualyLimit ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.otAnuualyLimit = val; },
            },
            {
              name: 'overTimeWorkingDay',
              label: 'Working Days',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g. 26',
              value: initialValues?.overTimeWorkingDay ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.overTimeWorkingDay = val; },
            },
          ],
        },
        {
          title: 'Rates (Multiplier of Normal Wage)',
          fields: [
            {
              name: 'normalOTRate',
              label: 'Normal Rate Multiplier',
              type: 'number',
              colSpan: 2,
              value: initialValues?.normalOTRate ?? '',
              placeholder: 'e.g., 1.5 = 1.5x Normal Wage',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.normalOTRate = val; },
            },
            {
              name: 'holidayOTRate',
              label: 'Holiday Rate Multiplier',
              type: 'number',
              colSpan: 2,
              value: initialValues?.holidayOTRate ?? '',
              placeholder: 'e.g., 2.0 = 2x Normal Wage',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.holidayOTRate = val; },
            },
            {
              name: 'otRateBasis',
              label: 'OT Rate Basis',
              type: 'select',
              colSpan: 2,
              options: [
                { label: 'Basic + DA', value: 'BasicDA' },
                { label: 'Gross Wages (Total Earnings)', value: 'Gross' },
              ],
              value: initialValues?.normalOTRateMultiplierBase === 'Gross' ? 'Gross' : 'BasicDA',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.otRateBasis = val; },
            },
          ],
        },
        {
          title: 'Additional Configuration',
          fields: [
            {
              name: 'overtimeConfiguration',
              label: 'OT Eligibility (minutes)',
              type: 'number',
              colSpan: 1,
              value: initialValues?.branchOTHoursRule ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.overtimeConfiguration = val; },
            },
            {
              name: 'workkingHours',
              label: 'Branch Work Hours',
              type: 'number',
              colSpan: 1,
              value: initialValues?.workkingHours ?? '',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: any) => { this.manualOvertimeData.workkingHours = val; },
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 2,
              options: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
              ],
              value: String(currentStatus),
              onChange: (val: any) => { this.manualOvertimeData.status = val; },
            },
          ],
        },
        {
          title: 'Fixed & Dynamic Overtime',
          fields: [
            {
              name: 'isOvertimeAllowed',
              label: 'Overtime Allowed',
              type: 'toggle',
              colSpan: 1,
              value: initialValues?.isOvertimeAllowed ?? true,
              onChange: (val: any) => { this.manualOvertimeData.isOvertimeAllowed = val; },
            },
            {
              name: 'isFixedOTAllowed',
              label: 'Fixed OT Allowed',
              type: 'toggle',
              colSpan: 1,
              value: initialValues?.isFixedOTAllowed ?? false,
              hint: 'A fixed daily OT slab that auto-processes with no daily approval (e.g. 3 hours/day).',
              onChange: (val: any) => { this.manualOvertimeData.isFixedOTAllowed = val; },
            },
            {
              name: 'fixedOTDailyHours',
              label: 'Fixed OT Daily Hours',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g. 3 (hours)',
              value: initialValues?.fixedOTDailyHours ?? '',
              disabled: (group: any) => !group.get('isFixedOTAllowed')?.value,
              required: (group: any) => !!group.get('isFixedOTAllowed')?.value,
              validations: [{ type: 'required', message: 'Required when Fixed OT is allowed' }],
              onChange: (val: any) => { this.manualOvertimeData.fixedOTDailyHours = val; },
            },
            {
              name: 'fixedOTRate',
              label: 'Fixed OT Rate Multiplier',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g., 1.0 = 1x Normal Wage',
              value: initialValues?.fixedOTRate ?? '',
              disabled: (group: any) => !group.get('isFixedOTAllowed')?.value,
              required: (group: any) => !!group.get('isFixedOTAllowed')?.value,
              validations: [{ type: 'required', message: 'Required when Fixed OT is allowed' }],
              onChange: (val: any) => { this.manualOvertimeData.fixedOTRate = val; },
            },
            {
              name: 'fixedOTRateBasis',
              label: 'Fixed OT Rate Basis',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'Basic + DA', value: 'BasicDA' },
                { label: 'Gross Wages (Total Earnings)', value: 'Gross' },
              ],
              value: initialValues?.fixedOTRateMultiplierBase === 'Gross' ? 'Gross' : 'BasicDA',
              disabled: (group: any) => !group.get('isFixedOTAllowed')?.value,
              onChange: (val: any) => { this.manualOvertimeData.fixedOTRateBasis = val; },
            },
            {
              name: 'isDynamicOTAllowed',
              label: 'Dynamic OT Allowed',
              type: 'toggle',
              colSpan: 1,
              value: initialValues?.isDynamicOTAllowed ?? true,
              hint: 'OT worked beyond the fixed daily hours goes to the normal approval queue at the Normal/Holiday rates above.',
              onChange: (val: any) => { this.manualOvertimeData.isDynamicOTAllowed = val; },
            },
          ],
        },
        {
          title: 'OT Bank / Leave Conversion',
          fields: [
            {
              name: 'isOvertimeBankEnabled',
              label: 'OT Bank Enabled',
              type: 'toggle',
              colSpan: 1,
              value: otBankValues?.isEnabled ?? false,
              hint: 'Approved OT hours (all types) accrue into a bank employees can redeem for a half/full day off.',
              onChange: (val: any) => { this.manualOvertimeData.isOvertimeBankEnabled = val; },
            },
            {
              name: 'halfDayHoursThreshold',
              label: 'Half-Day Threshold (Hours)',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g. 3',
              value: otBankValues?.halfDayHoursThreshold ?? '',
              disabled: (group: any) => !group.get('isOvertimeBankEnabled')?.value,
              required: (group: any) => !!group.get('isOvertimeBankEnabled')?.value,
              validations: [{ type: 'required', message: 'Required when OT Bank is enabled' }],
              onChange: (val: any) => { this.manualOvertimeData.halfDayHoursThreshold = val; },
            },
            {
              name: 'fullDayHoursThreshold',
              label: 'Full-Day Threshold (Hours)',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g. 6',
              value: otBankValues?.fullDayHoursThreshold ?? '',
              disabled: (group: any) => !group.get('isOvertimeBankEnabled')?.value,
              required: (group: any) => !!group.get('isOvertimeBankEnabled')?.value,
              validations: [{ type: 'required', message: 'Required when OT Bank is enabled' }],
              onChange: (val: any) => { this.manualOvertimeData.fullDayHoursThreshold = val; },
            },
            {
              name: 'maxBalanceHours',
              label: 'Max Balance (Hours)',
              type: 'number',
              colSpan: 1,
              placeholder: 'Optional - leave blank for no cap',
              value: otBankValues?.maxBalanceHours ?? '',
              disabled: (group: any) => !group.get('isOvertimeBankEnabled')?.value,
              onChange: (val: any) => { this.manualOvertimeData.maxBalanceHours = val; },
            },
            {
              name: 'otBankRedemptionRequiresApproval',
              label: 'Redemption Requires Approval',
              type: 'toggle',
              colSpan: 1,
              value: otBankValues?.redemptionRequiresApproval ?? true,
              disabled: (group: any) => !group.get('isOvertimeBankEnabled')?.value,
              onChange: (val: any) => { this.manualOvertimeData.otBankRedemptionRequiresApproval = val; },
            },
            {
              name: 'dispositionMode',
              label: 'Unredeemed Balance',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'Carry Forward Monthly', value: 'CarryForwardMonth' },
                { label: 'Carry Forward Yearly', value: 'CarryForwardYear' },
                { label: 'Lapse Every Month', value: 'Lapse' },
              ],
              value: otBankValues?.dispositionMode || 'CarryForwardMonth',
              disabled: (group: any) => !group.get('isOvertimeBankEnabled')?.value,
              onChange: (val: any) => { this.manualOvertimeData.dispositionMode = val; },
            },
            {
              name: 'carryForwardMaxHours',
              label: 'Carry-Forward Cap (Hours)',
              type: 'number',
              colSpan: 1,
              placeholder: 'Optional - leave blank for no cap',
              value: otBankValues?.carryForwardMaxHours ?? '',
              disabled: (group: any) => !group.get('isOvertimeBankEnabled')?.value || group.get('dispositionMode')?.value === 'Lapse',
              onChange: (val: any) => { this.manualOvertimeData.carryForwardMaxHours = val; },
            },
            {
              name: 'otRedemptionLeaveTypeMasterId',
              label: 'Redemption Leave Type',
              type: 'select',
              colSpan: 1,
              options: this.leaveTypeOptions,
              value: otBankValues?.otRedemptionLeaveTypeMasterId || otBankValues?.OtRedemptionLeaveTypeMasterId || '',
              hint: 'A redeemed OT-bank day is recorded as leave under this type - pick a leave type created specifically for this (e.g. "OT Leave").',
              disabled: (group: any) => !group.get('isOvertimeBankEnabled')?.value,
              required: (group: any) => !!group.get('isOvertimeBankEnabled')?.value,
              validations: [{ type: 'required', message: 'Required when OT Bank is enabled' }],
              onChange: (val: any) => { this.manualOvertimeData.otRedemptionLeaveTypeMasterId = val; },
            },
          ],
        },
      ],
    };
  }

  // ---------------------------------------------------------
  // 2. DATA FETCHING
  // ---------------------------------------------------------

  getBranchOT() {
    if (!this.companyBranchId && this.route.snapshot.params['id']) {
      this.companyBranchId = this.route.snapshot.params['id'];
    }

    this.overtimeDataLoaded = false;

    // The OT-hours bank (Feature 1) is a separate, ALMS-only table with no
    // HRMSAuthZ/CAB copies, and its leave-type picker needs the branch's leave
    // types too - all three are fetched together so initializeOvertimeConfig()
    // only ever runs once with everything it needs, rather than a second call
    // later re-seeding the form from a mismatched object (manualOvertimeData
    // uses different field names than the raw API responses for a few fields,
    // e.g. otRateBasis vs normalOTRateMultiplierBase).
    forkJoin({
      main: this.reposotory.get(`api/company-branch/GetBranchOvertimeSetting?branchId=${this.companyBranchId}`).pipe(catchError(() => of(null))),
      otBank: this.reposotory.get(`api/AttendenceSource/GetOvertimeBankSettings?branchID=${this.companyBranchId}`).pipe(catchError(() => of(null))),
      leaveTypes: this.reposotory.get('api/AttendenceSource/GetLeaveMasters').pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ main, otBank, leaveTypes }: any) => {
        const emptyGuid = '00000000-0000-0000-0000-000000000000';
        this.leaveTypeOptions = (leaveTypes || [])
          .filter((lt: any) => !lt.branchId || lt.branchId === emptyGuid || lt.branchId === this.companyBranchId)
          .map((lt: any) => ({ label: lt.leaveTypeName, value: lt.leaveTypeMasterId }));

        const otBankSetting = otBank && otBank.length > 0 ? otBank[0] : null;
        this.overtimeBankSettingId = otBankSetting?.overtimeBankSettingID || otBankSetting?.OvertimeBankSettingID || null;

        const overtimeData = main && main.length > 0 ? main[0] : null;
        this.initializeOvertimeConfig(overtimeData, otBankSetting);
        this.overtimeDataLoaded = true;

        // Fetch ALMS OT ID for sync
        this.reposotory
          .get(`api/AttendenceSource/GetBranchOvertimeSettings?branchID=${this.companyBranchId}`)
          .subscribe({
            next: (almsData: any) => {
              if (almsData && almsData.length > 0) {
                this.almsOvertimeId = almsData[0].branchOvertimeSettingID || almsData[0].BranchOvertimeSettingID || null;
              } else {
                this.almsOvertimeId = null;
              }
            },
            error: () => { this.almsOvertimeId = null; }
          });
        // Fetch CAB (Salary service) OT ID for sync - this is the copy the actual
        // salary/OT-pay calculation reads from, and was never being written to at all.
        this.reposotory
          .get(`api/Salary/GetBranchOvertimeSettings?branchID=${this.companyBranchId}`)
          .subscribe({
            next: (cabData: any) => {
              if (cabData && cabData.length > 0) {
                this.cabOvertimeId = cabData[0].branchOvertimeSettingID || cabData[0].BranchOvertimeSettingID || null;
              } else {
                this.cabOvertimeId = null;
              }
            },
            error: () => { this.cabOvertimeId = null; }
          });
      },
      error: () => {
        this.notificationService.showError('Error loading overtime config');
        this.initializeOvertimeConfig(null);
        this.overtimeDataLoaded = true;
      },
    });
  }

  // ---------------------------------------------------------
  // 3. SUBMIT LOGIC
  // ---------------------------------------------------------

  onOvertimeFormSubmit(data: any, id?: any) {
    const finalId = id || this.overtimeId;
    console.log('[BRANCH_DETAILS] onOvertimeFormSubmit started. ID:', finalId, 'Data:', data);

    // Create PascalCase payload for backend DTO - MUST match casing exactly!
    const payload: any = {
      CompanyBranchId: this.companyBranchId,
      BranchOvertimeSettingID: finalId || undefined,
      OTDailyLimit: parseFloat(String(data.otDailyLimit || 0)) || 0,
      OTWeeklyLimit: parseFloat(String(data.otWeeklyLimit || 0)) || 0,
      OTMonthlyLimit: parseFloat(String(data.otMonthlyLimit || 0)) || 0,
      OTQuarterlyLimit: parseFloat(String(data.otQuarterlyLimit || 0)) || 0,
      OTAnuualyLimit: parseFloat(String(data.otAnuualyLimit || 0)) || 0,
      OverTimeWorkingDay: parseFloat(String(data.overTimeWorkingDay || 0)) || 0,
      NormalOTRateMultiplierBase: data.otRateBasis === 'Gross' ? 'Gross' : 'BasicDA',
      NormalOTRate: parseFloat(data.normalOTRate) || 1.0,
      HolidayOTRateMultiplierBase: data.otRateBasis === 'Gross' ? 'Gross' : 'BasicDA',
      HolidayOTRate: parseFloat(data.holidayOTRate) || 1.0,
      BookKeeping: '',
      BranchOTHoursRule: parseFloat(String(data.overtimeConfiguration || 0)) || 0,
      WorkkingHours: parseFloat(String(data.workkingHours || 0)) || 0,
      Status: UtilityService.normalizeStatus(data.status),
      IsOvertimeAllowed: !!data.isOvertimeAllowed,
      IsFixedOTAllowed: !!data.isFixedOTAllowed,
      FixedOTDailyHours: data.isFixedOTAllowed ? (parseFloat(String(data.fixedOTDailyHours)) || null) : null,
      FixedOTRateMultiplierBase: data.isFixedOTAllowed ? (data.fixedOTRateBasis === 'Gross' ? 'Gross' : 'BasicDA') : null,
      FixedOTRate: data.isFixedOTAllowed ? (parseFloat(String(data.fixedOTRate)) || null) : null,
      IsDynamicOTAllowed: !!data.isDynamicOTAllowed,
    };

    const isUpdate = !!this.overtimeId;
    console.log('[BRANCH_DETAILS] Overtime Payload (PascalCase):', payload);
    const apiCall = isUpdate
      ? this.reposotory.update(
        'api/company-branch/UpdateBranchOvertimeSetting',
        payload,
      )
      : this.reposotory.post(
        'api/company-branch/CreateBranchOvertimeSetting',
        payload,
      );

    apiCall.subscribe({
      next: (res) => {
        console.log('[BRANCH_DETAILS] Overtime API Success:', res);
        this.notificationService.showSuccess(
          `Overtime ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        // Sync same data to ALMS DB so shift-master picks it up
        const almsPayload: any = { ...payload };
        if (this.almsOvertimeId) {
          almsPayload.BranchOvertimeSettingID = this.almsOvertimeId;
          this.reposotory.update('api/AttendenceSource/UpdateBranchOverTimeSetting', almsPayload).subscribe({
            next: () => {
              console.log('[BRANCH_DETAILS] ALMS overtime sync: updated');
              this.verifyOvertimeFanOutApplied('Attendance service', `api/AttendenceSource/GetBranchOvertimeSettings?branchID=${this.companyBranchId}`, payload);
            },
            error: (e: HttpErrorResponse) => {
              console.error('[BRANCH_DETAILS] ALMS overtime sync error:', e);
              // ALMS holds the copy the real-time/attendance overtime calculator
              // actually reads - a silent console-only failure here previously let
              // admins believe the new limits/rates were live everywhere when the
              // attendance side was still on stale settings.
              this.notificationService.showError(
                `Attendance-service overtime sync failed (HTTP ${e.status}): ${e.error?.message || e.error?.title || e.message || 'unknown error'}. Overtime calculated from attendance will NOT use these rates until this is fixed.`
              );
            }
          });
        } else {
          delete almsPayload.BranchOvertimeSettingID;
          this.reposotory.post('api/AttendenceSource/CreateBranchOverTimeSetting', almsPayload).subscribe({
            next: () => {
              console.log('[BRANCH_DETAILS] ALMS overtime sync: created');
              this.almsOvertimeId = null; // will be refreshed on next getBranchOT
              this.verifyOvertimeFanOutApplied('Attendance service', `api/AttendenceSource/GetBranchOvertimeSettings?branchID=${this.companyBranchId}`, payload);
            },
            error: (e: HttpErrorResponse) => {
              console.error('[BRANCH_DETAILS] ALMS overtime sync error:', e);
              this.notificationService.showError(
                `Attendance-service overtime sync failed (HTTP ${e.status}): ${e.error?.message || e.error?.title || e.message || 'unknown error'}. Overtime calculated from attendance will NOT use these rates until this is fixed.`
              );
            }
          });
        }
        // Sync same data to CAB (Salary service) DB too - this is the copy
        // salary-proceess's OT-pay calculation actually reads from at salary time.
        const cabPayload: any = { ...payload };
        if (this.cabOvertimeId) {
          cabPayload.BranchOvertimeSettingID = this.cabOvertimeId;
          this.reposotory.update('api/Salary/UpdateBranchOvertimeSetting', cabPayload).subscribe({
            next: () => {
              console.log('[BRANCH_DETAILS] CAB overtime sync: updated');
              this.verifyOvertimeFanOutApplied('Salary service', `api/Salary/GetBranchOvertimeSettings?branchID=${this.companyBranchId}`, payload);
            },
            error: (e: HttpErrorResponse) => {
              console.error('[BRANCH_DETAILS] CAB overtime sync error:', e.status, e.error, e.message);
              this.notificationService.showError(
                `Salary-service overtime sync failed (HTTP ${e.status}): ${e.error?.message || e.error?.title || e.message || 'unknown error'}. Actual overtime pay will NOT use these rates until this is fixed.`
              );
            }
          });
        } else {
          delete cabPayload.BranchOvertimeSettingID;
          this.reposotory.post('api/Salary/CreateBranchOvertimeSetting', cabPayload).subscribe({
            next: () => {
              console.log('[BRANCH_DETAILS] CAB overtime sync: created');
              this.cabOvertimeId = null; // will be refreshed on next getBranchOT
              this.verifyOvertimeFanOutApplied('Salary service', `api/Salary/GetBranchOvertimeSettings?branchID=${this.companyBranchId}`, payload);
            },
            error: (e: HttpErrorResponse) => {
              console.error('[BRANCH_DETAILS] CAB overtime sync error:', e.status, e.error, e.message);
              this.notificationService.showError(
                `Salary-service overtime sync failed (HTTP ${e.status}): ${e.error?.message || e.error?.title || e.message || 'unknown error'}. Actual overtime pay will NOT use these rates until this is fixed.`
              );
            }
          });
        }
        this.getBranchOT(); // Refresh data
      },
      error: (err: HttpErrorResponse) => {
        console.error('[BRANCH_DETAILS] Overtime API Error:', err);
        this.notificationService.showError(
          err.error?.message || 'Error saving overtime',
        );
      },
    });
  }

  // A successful sync HTTP call only means the write was accepted, not that the
  // service actually persisted the Fixed/Dynamic values it was sent - reads them
  // back and warns if they don't match, so a stale ALMS/CAB copy of these
  // specific fields can't silently cause auto-approved Fixed OT hours to go
  // un-priced, or hours that should require Dynamic approval to auto-process.
  private verifyOvertimeFanOutApplied(serviceLabel: string, getUrl: string, expected: any): void {
    this.reposotory.get(getUrl).subscribe({
      next: (data: any) => {
        const saved = data && data.length > 0 ? data[0] : null;
        if (!saved) return;

        const mismatches: string[] = [];
        const check = (label: string, expectedVal: any, actualVal: any) => {
          if ((expectedVal ?? null) === null && (actualVal ?? null) === null) return;
          if (String(expectedVal ?? '') !== String(actualVal ?? '')) {
            mismatches.push(label);
          }
        };

        check('Overtime Allowed', expected.IsOvertimeAllowed, saved.isOvertimeAllowed);
        check('Fixed OT Allowed', expected.IsFixedOTAllowed, saved.isFixedOTAllowed);
        check('Fixed OT Daily Hours', expected.FixedOTDailyHours, saved.fixedOTDailyHours);
        check('Fixed OT Rate', expected.FixedOTRate, saved.fixedOTRate);
        check('Dynamic OT Allowed', expected.IsDynamicOTAllowed, saved.isDynamicOTAllowed);

        if (mismatches.length > 0) {
          this.notificationService.showError(
            `${serviceLabel}'s overtime settings are out of sync with what you just saved (${mismatches.join(', ')}). Re-save to retry - this branch's OT behavior may not match what's shown here until it's fixed.`
          );
        }
      },
      error: () => {
        // Already surfaced by the sync call's own error handler - avoid a duplicate toast.
      }
    });
  }

  validateMobile(mobile: string): string | null {
    if (!mobile) return null;
    if (!/^[0-9]*$/.test(mobile)) {
      return 'Only numbers are required';
    }
    if (mobile.length > 10) {
      return 'Valid 10-digit phone number';
    }
    if (mobile.length < 10) {
      return null;
    }
    return null;
  }
  validateEmail(
    email: string,
  ): { required?: boolean; strongEmail?: boolean } | null {
    if (!email) {
      return { required: true };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { strongEmail: true };
    }
    return null;
  }
  expandedPanelIndex: number | undefined = 0;
  selectedSection: string | null = null;

  // Form state tracking
  isFormDirty: { [key: string]: boolean } = {};
  originalData: { [key: string]: any } = {};

  loadSection(section: string): void {
    this.selectedSection = section;
    // Initialize form state when section is loaded
    this.initializeFormState(section);
  }

  initializeFormState(section: string): void {
    // Initialize empty objects if arrays are empty, or store original data for comparison
    if (section === 'statutory') {
      if (this.dataSource1.length === 0) {
        // Create empty object for adding new statutory
        this.dataSource1 = [
          {
            companyPanNo: '',
            companyCinNo: '',
            companyPfNo: '',
            companyEsiNo: '',
            companyTanNo: '',
            companyTdsCircle: '',
            companyAoCode: '',
            tradeNumber: '',
            eidNumber: '',
            pfCalculation: 'Max Limit as per Act',
            pfCalculationBasis: 'Basic',
            pfOverridableEmployee: 'Yes',
            isPfExpensesIncludeInCTC: 'Yes',
            isPfExpensesOverridableAtEmployeeLevel: 'Yes',
            status: 1,
          },
        ];
      }
      this.originalData[section] = UtilityService.deepClone(
        this.dataSource1[0],
      );
      this.isFormDirty[section] = false;
    } else if (section === 'tax') {
      if (this.dataSource2.length === 0) {
        this.dataSource2 = [
          {
            taxDeductorName: '',
            taxDeductorFatherName: '',
            taxDeductorDesignation: '',
            taxDeductorMobileNo: '',
            taxDeductorEmailId: '',
            status: 1,
          },
        ];
      }

      // Populate FormConfig with existing data
      if (this.dataSource2.length > 0) {
        const taxData = this.dataSource2[0];
        this.initializeTaxFormConfig(taxData);
      } else {
        this.initializeTaxFormConfig(null);
      }

      this.originalData[section] = UtilityService.deepClone(this.dataSource2);
      this.isFormDirty[section] = false;
    } else if (section === 'leaveEncashment') {
      if (this.dataSource5.length === 0) {
        this.dataSource5 = [
          {
            maxEncashmentDays: '',
            minLeaveBalance: '',
            taxExemptionLimit: '',
            tdsRate: '',
            remark: '',
            status: 1,
          },
        ];
      }

      // Populate FormConfig with existing data
      if (this.dataSource5.length > 0) {
        const leaveData = this.dataSource5[0];
        this.initializeLeaveFormConfig(leaveData);
      } else {
        this.initializeLeaveFormConfig(null);
      }

      this.originalData[section] = UtilityService.deepClone(
        this.dataSource5[0],
      );
      this.isFormDirty[section] = false;
    } else if (section === 'weeklyOff') {
      if (this.dataSource6.length === 0) {
        this.dataSource6 = [
          { dayName: 'Monday', isWeeklyOff: false, status: 1 },
          { dayName: 'Tuesday', isWeeklyOff: false, status: 1 },
          { dayName: 'Wednesday', isWeeklyOff: false, status: 1 },
          { dayName: 'Thursday', isWeeklyOff: false, status: 1 },
          { dayName: 'Friday', isWeeklyOff: false, status: 1 },
          { dayName: 'Saturday', isWeeklyOff: true, status: 1 },
          { dayName: 'Sunday', isWeeklyOff: true, status: 1 },
        ];
      }
      this.originalData[section] = UtilityService.deepClone(this.dataSource6);
      this.isFormDirty[section] = false;
    } else if (section === 'contact') {
      if (!this.dataSource || this.dataSource.length === 0) {
        this.dataSource = [
          {
            contactPerson: '',
            primaryEmailId: '',
            secondaryEmailId: '',
            primaryMobileNo: '',
            secondaryMobileNo: '',
            status: 1,
          },
        ];
      }
      this.originalData[section] = UtilityService.deepClone(this.dataSource[0]);
      this.isFormDirty[section] = false;
    } else if (section === 'overtime') {
      this.getBranchOT();
    } else if (section === 'dateTime') {
      this.getBranchDateTimeSettings();
    }
  }

  onFieldChange(section: string): void {
    this.isFormDirty[section] = false;
    if (section === 'tax') {
      this.mobileErrors.tax = this.dataSource2.map((tax) => ({
        mobile: this.validateMobile(tax.taxDeductorMobileNo),
      }));

      this.emailErrors.tax = this.dataSource2.map((tax) =>
        this.validateEmail(tax.taxDeductorEmailId),
      );
    }
    if (section === 'statutory') {
      // FormConfig handles validation
    }
  }

  cancelChanges(section: string): void {
    const sectionMap: { [key: string]: { dataSource: any[]; index: number } } =
    {
      statutory: { dataSource: this.dataSource1, index: 0 },
      contact: { dataSource: this.dataSource, index: 0 },
      tax: { dataSource: this.dataSource2, index: 0 },
      leaveEncashment: { dataSource: this.dataSource5, index: 0 },
      weeklyOff: { dataSource: this.dataSource6, index: 0 },
    };

    const config = sectionMap[section];
    if (config) {
      if (this.originalData[section]) {
        if (
          section === 'contact' ||
          section === 'tax' ||
          section === 'weeklyOff'
        ) {
          config.dataSource = UtilityService.deepClone(
            this.originalData[section],
          );
        } else {
          config.dataSource[config.index] = UtilityService.deepClone(
            this.originalData[section],
          );
        }
      } else {
        this.initializeFormState(section);
      }
      this.isFormDirty[section] = false;
    }
  }

  onTaxDeductorSubmit(data: any, id?: any): void {
    console.log('[BRANCH_DETAILS] onTaxDeductorSubmit started. Data:', data);
    const taxId = id || this.taxId || (this.dataSource2 && this.dataSource2[0]?.id) || (this.dataSource2 && this.dataSource2[0]?.Id);
    console.log('[BRANCH_DETAILS] id/taxId check:', { dataSourceId: this.dataSource2[0]?.id, taxId });

    // Handle phone object
    const mobileNo =
      typeof data.taxDeductorMobileNo === 'object'
        ? data.taxDeductorMobileNo?.number || ''
        : data.taxDeductorMobileNo;

    const payload: any = {
      Id: taxId || undefined,
      CompanyBranchId: this.companyBranchId,
      TaxDeductorName: String(data.taxDeductorName || '').trim(),
      TaxDeductorFatherName: String(data.fatherName || '').trim(), // Changed from taxDeductorFatherName
      TaxDeductorDesignation: String(data.designation || '').trim(), // Changed from taxDeductorDesignation
      TaxDeductorMobileNo: String(mobileNo || '').trim(),
      TaxDeductorEmailId: String(data.taxDeductorEmailId || '').trim(),
      CompanyAoCode: String(data.aoCode || '').trim(), // New field
      CompanyTdsCircle: String(data.tdsCircle || '').trim(), // New field
      Status: UtilityService.normalizeStatus(data.status),
    };

    const isUpdate = !!taxId;
    console.log('[BRANCH_DETAILS] Tax Deductor Payload (PascalCase):', payload);
    const apiUrl = isUpdate
      ? 'api/company-branch/UpdateCompanyTaxDeductor'
      : 'api/company-branch/CreateCompanyTaxDeductor';

    const apiCall = isUpdate
      ? this.reposotory.update(apiUrl, payload)
      : this.reposotory.post(apiUrl, payload);

    apiCall.subscribe({
      next: (res) => {
        console.log('[BRANCH_DETAILS] Tax Deductor API Success:', res);
        this.notificationService.showSuccess(
          isUpdate
            ? 'Tax Deductor updated successfully'
            : 'Tax Deductor saved successfully',
        );
        this.getTaxDeductor();
      },
      error: (error: HttpErrorResponse) => {
        console.error('[BRANCH_DETAILS] Tax Deductor API Error:', error);
        this.notificationService.showError(
          error?.error?.message || 'Error saving Tax Deductor',
        );
      },
    });
  }

  onLeaveEncashmentSubmit(data: any, id?: any): void {
    console.log('[BRANCH_DETAILS] onLeaveEncashmentSubmit started. Data:', data);
    const leaveId = id || this.leaveId || this.dataSource5[0]?.branchLeaveId || this.dataSource5[0]?.Id || this.dataSource5[0]?.id;
    const statusValue = UtilityService.normalizeStatus(data.status);

    // Matching BranchLeaveEncashmentSettingsDto.cs exactly
    const payload: any = {
      CompanyBranchId: this.companyBranchId,
      MaxEncashmentDays: parseInt(String(data.maxEncashmentDays || '0')) || 0,
      MinLeaveBalance: parseInt(String(data.minLeaveBalance || '0')) || 0,
      TaxExemptionLimit: parseFloat(String(data.taxExemptionLimit || '0')) || 0,
      TDSRate: parseFloat(String(data.tdsRate || '0')) || 0, // Caps TDS
      Remark: String(data.remark || ''),
      Status: String(statusValue), // Backend expects string? based on DTO
    };

    if (leaveId) {
      payload.BranchLeaveId = String(leaveId);
    }

    const isUpdate = !!leaveId;
    console.log('[BRANCH_DETAILS] Leave Encashment Payload (PascalCase):', payload);
    const apiEndpoint = isUpdate
      ? 'api/company-branch/UpdateBranchLeaveEncashment'
      : 'api/company-branch/CreateBranchLeaveEncashment';

    const apiCall = isUpdate
      ? this.reposotory.update(apiEndpoint, payload)
      : this.reposotory.post(apiEndpoint, payload);

    apiCall.subscribe({
      next: (res) => {
        console.log('[BRANCH_DETAILS] Leave Encashment API Success:', res);
        this.notificationService.showSuccess(
          `Leave Encashment ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        this.getLeaveEncashment();
      },
      error: (err: HttpErrorResponse) => {
        console.error('[BRANCH_DETAILS] Leave Encashment API Error:', err);
        this.notificationService.showError(
          err.error?.message ||
          `Error ${isUpdate ? 'updating' : 'creating'} leave encashment`,
        );
      },
    });
  }

  submitChanges(section: string): void {
    // if (this.overtimeErrors.daily || this.overtimeErrors.weekly ||
    //   this.overtimeErrors.monthly || this.overtimeErrors.quarterly || this.overtimeErrors.annual) {
    //   this.notificationService.showError('Please correct the overtime limit errors');
    //   return;
    // }

    if (section === 'leaveEncashment') {
      this.isFormDirty['leaveEncashment'] = true;
      const leave = this.dataSource5[0];
      if (!leave) {
        this.notificationService.showError('Please fill all required fields');
        return;
      }
      if (
        !leave.maxEncashmentDays ||
        !leave.minLeaveBalance ||
        !leave.taxExemptionLimit ||
        !leave.tdsRate
      ) {
        this.notificationService.showError('Please fill all required fields');
        return;
      }
    }

    if (section === 'contact' && this.dataSource.length > 0) {
      this.dataSource.forEach((contact: any) => {
        if (this.isFormDirty[section]) {
          const payload: any = {
            companyBranchId: this.id,
            employeeId: contact.isFreeText ? null : contact.employeeId || null,
            contactPerson: contact.contactPerson || '',
            primaryEmailId: contact.primaryEmailId || '',
            secondaryEmailId: contact.secondaryEmailId || '',
            primaryMobileNo: contact.primaryMobileNo || '',
            secondaryMobileNo: contact.secondaryMobileNo || '',
            status: UtilityService.normalizeStatus(contact.status),
          };

          if (contact.id) {
            payload.id = contact.id;
          }

          const contactPayload: branchContactDetailsDto =
            payload as branchContactDetailsDto;
          const isUpdate = !!contact.id;
          const apiCall = isUpdate
            ? this.reposotory.update(
              'api/company-branch/UpdateCompanyBranchContactDetail',
              contactPayload,
            )
            : this.reposotory.post(
              'api/company-branch/CreateCompanyBranchContactDetail',
              contactPayload,
            );

          apiCall.subscribe({
            next: () => {
              if (!contact.isFreeText && contact.employeeId) {
                const employeePayload = {
                  employeeContactDetailsId:
                    contact.employeeContactDetailsId || null,
                  employeeId: contact.employeeId,
                  email: contact.primaryEmailId || '',
                  personalEmailId: contact.secondaryEmailId || '',
                  primaryMobileNo: contact.primaryMobileNo || '',
                  secondaryMobileNo: contact.secondaryMobileNo || '',
                  workPhoneNo: contact.workPhoneNo || '',
                  extensionNo: contact.extensionNo || '',
                  floorNumber: contact.floorNumber || '',
                  seatingType: contact.seatingType || '',
                  remark: contact.remark || '',
                  status: contact.status || 1,
                };

                this.reposotory
                  .update(
                    'api/Employee/EmployeeContactDetailUpdate',
                    { dto: employeePayload },
                  )
                  .subscribe({
                    error: (err) =>
                      console.error('Employee contact update failed', err),
                  });
              }
              this.notificationService.showSuccess(
                `Contact ${isUpdate ? 'updated' : 'created'} successfully`,
              );
              this.getBranchContact();
              this.isFormDirty[section] = false;
              this.initializeFormState(section);
            },
            error: (err) => {
              this.notificationService.showError(
                `Error ${isUpdate ? 'updating' : 'creating'} contact`,
              );
              console.error(err);
            },
          });
        }
      });
    } else if (section === 'tax' && this.dataSource2.length > 0) {
      this.dataSource2.forEach((tax: any) => {
        if (this.isFormDirty[section]) {
          const payload: any = {
            companyBranchId: this.id,
            taxDeductorName: tax.taxDeductorName || '',
            taxDeductorFatherName: tax.taxDeductorFatherName || '',
            taxDeductorDesignation: tax.taxDeductorDesignation || '',
            taxDeductorMobileNo: tax.taxDeductorMobileNo || '',
            taxDeductorEmailId: tax.taxDeductorEmailId || '',
            status: UtilityService.normalizeStatus(tax.status),
          };

          if (tax.id) {
            payload.id = tax.id;
          }

          const taxPayload: companyTaxDeductorDto =
            payload as companyTaxDeductorDto;
          const isUpdate = !!tax.id;
          const apiCall = isUpdate
            ? this.reposotory.update(
              'api/CompanyTaxDeductor/CompanyTaxDeductorUpdate',
              taxPayload,
            )
            : this.reposotory.post(
              'api/CompanyTaxDeductor/CreatCompanyTaxDeductor',
              taxPayload,
            );

          apiCall.subscribe({
            next: () => {
              this.notificationService.showSuccess(
                `Tax Deductor ${isUpdate ? 'updated' : 'created'} successfully`,
              );
              this.getTaxDeductor();
              this.isFormDirty[section] = false;
              this.initializeFormState(section);
            },
            error: (err) => {
              this.notificationService.showError(
                `Error ${isUpdate ? 'updating' : 'creating'} tax deductor`,
              );
              console.error(err);
            },
          });
        }
      });
    } else if (section === 'leaveEncashment' && this.dataSource5.length > 0) {
      if (this.isFormDirty[section]) {
        const leaveEncashment = this.dataSource5[0];
        const statusValue = UtilityService.normalizeStatus(
          leaveEncashment.status,
        );
        const payload: any = {
          companyBranchId: String(this.id || ''),
          maxEncashmentDays:
            parseInt(String(leaveEncashment.maxEncashmentDays || '0')) || 0,
          minLeaveBalance:
            parseInt(String(leaveEncashment.minLeaveBalance || '0')) || 0,
          taxExemptionLimit:
            parseFloat(String(leaveEncashment.taxExemptionLimit || '0')) || 0,
          tdsRate: parseFloat(String(leaveEncashment.tdsRate || '0')) || 0,
          remark: String(leaveEncashment.remark || ''),
          status: String(statusValue),
        };

        if (leaveEncashment.branchLeaveId) {
          payload.branchLeaveId = String(leaveEncashment.branchLeaveId);
        }

        const isUpdate = !!leaveEncashment.branchLeaveId;
        const apiCall = isUpdate
          ? this.reposotory.update(
            'api/AttendenceSource/updateBranchleaveEncashment',
            payload,
          )
          : this.reposotory.post(
            'api/AttendenceSource/createBranchleaveEncashment',
            payload,
          );

        apiCall.subscribe({
          next: () => {
            this.notificationService.showSuccess(
              `Leave Encashment ${isUpdate ? 'updated' : 'created'} successfully`,
            );
            this.getLeaveEncashment();
            this.isFormDirty[section] = false;
            this.initializeFormState(section);
          },
          error: (err) => {
            this.notificationService.showError(
              `Error ${isUpdate ? 'updating' : 'creating'} leave encashment`,
            );
            console.error(err);
          },
        });
      }
    } else if (section === 'weeklyOff' && this.dataSource6.length > 0) {
      this.dataSource6.forEach((weeklyOff: any) => {
        if (weeklyOff.id && this.isFormDirty[section]) {
          this.onEditWeeklyOff(weeklyOff);
        }
      });
      if (this.isFormDirty[section]) {
        this.isFormDirty[section] = false;
      }
    }
  }

  getSectionTitle(section: string): string {
    const titles: { [key: string]: string } = {
      contact: 'Contact',
      statutory: 'Statutory',
      tax: 'Tax Deductor',
      address: 'Address',
      overtime: 'Overtime Configuration',
      leaveEncashment: 'Leave Encashment System Configuration',
      weeklyOff: 'Weekly Off Configuration',
      dateTime: 'Date & Time Settings',
    };
    return titles[section] || section;
  }

  panelChanged(index: number): void {
    this.expandedPanelService.expandedPanelIndex = index;
    this.expandedPanelIndex = index;
  }

  //   goBack(): void {
  //     this.router.navigate(['details/:companyId'], {
  //       queryParams: { guidCompanyId
  // : this.companyId }
  //     });
  //   }
  goBack(): void {
    this.router.navigate(['company/details', this.companyId]);
  }

  public getDetails = () => {
    if (!this.companyId) return;

    this.reposotory
      .getCompany(`api/company-branch/GetCompany?id=${this.companyId}`)
      .subscribe({
        next: (data) => {
          this.details = Array.isArray(data) ? data[0] : data;
        },
      });
  };

  public getBranchDetails = () => {
    if (!this.id) return;

    this.reposotory
      .get(`api/company-branch/GetCompanyBranch?branchId=${this.id}`)
      .subscribe({
        next: (data) => {
          this.branchDetails = Array.isArray(data) ? data[0] : data;
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

  getBranchContact = () => {
    if (!this.id && this.route.snapshot.params['id']) {
      this.id = this.route.snapshot.params['id'];
    }

    console.log('[BRANCH_DETAILS] Fetching Contact for Branch ID:', this.id);
    this.reposotory
      .get(
        `api/company-branch/GetCompanyBranchContactDetail/?companyBranchId=${this.id}`,
      )
      .subscribe({
        next: (data) => {
          console.log('[BRANCH_DETAILS] Contact raw data received:', data);
          this.contactDataLoaded = false;
          this.cdr.detectChanges(); // Use CDR instead of just setTimeout flickers

          if (data && data.length > 0) {
            const firstRecord = data[0];
            const existingContact = {
              ...firstRecord,
              id: firstRecord.id || firstRecord.Id || firstRecord.companyBranchContactDetailId,
              status: UtilityService.normalizeStatus(firstRecord.status),
            };
            this.initializeContactConfig(existingContact);
          } else {
            this.initializeContactConfig(null);
          }

          setTimeout(() => {
            this.contactDataLoaded = true;
            this.cdr.detectChanges();
            console.log('[BRANCH_DETAILS] contactDataLoaded set to true (via CDR)');
          }, 50);
        },
        error: (err: HttpErrorResponse) => {
          console.error('[BRANCH_DETAILS] Error loading contact info:', err);
          this.initializeContactConfig(null);
          this.contactDataLoaded = true;
          this.cdr.detectChanges();
        },
      });
  };

  // Manual Data Tracking for Fallback (Internal use for now)



  initializeContactConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeContactConfig - v22.4', initialValues);
    this.manualContactData = { ...initialValues };
    const contactId = initialValues?.id || initialValues?.Id || initialValues?.companyBranchContactDetailId;
    this.contactId = contactId;
    const isUpdate = !!contactId;

    this.contactFormConfig = {
      formTitle: '',
      submitLabel: isUpdate ? 'Update Details' : 'Save Details',
      maxColsPerRow: 2,
      hideSubmit: false,
      hideCancel: false,
      onSubmit: (data: any) => {
        this.onContactFormSubmit(data, this.contactId);
      },
      onCancel: () => {
        this.getBranchContact();
      },
      sections: [
        {
          fields: [
            {
              name: 'contactPerson',
              label: 'Contact Person Name',
              type: 'text',
              colSpan: 1,
              value: initialValues?.contactPerson || '',
              placeholder: 'Enter contact name',
              onChange: (val: any) => (this.manualContactData.contactPerson = val),
              validations: [
                { type: 'required', message: 'Required' },
                { type: 'maxLength', value: 100, message: 'Max 100 characters' },
              ],
            },
            {
              name: 'primaryEmailId',
              label: 'Primary Email',
              type: 'email',
              colSpan: 1,
              value: initialValues?.primaryEmailId || '',
              onChange: (val: any) => (this.manualContactData.primaryEmailId = val),
              validations: [
                { type: 'required', message: 'Required' },
                {
                  type: 'pattern',
                  value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                  message: 'Invalid email',
                },
              ],
            },
            {
              name: 'secondaryEmailId',
              label: 'Secondary Email',
              type: 'text',
              colSpan: 1,
              value: initialValues?.secondaryEmailId || '',
              onChange: (val: any) => (this.manualContactData.secondaryEmailId = val),
              validations: [
                {
                  type: 'pattern',
                  value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                  message: 'Invalid secondary email',
                },
              ],
            },
            {
              name: 'primaryMobileNo',
              label: 'Primary Mobile',
              type: 'text',
              colSpan: 1,
              value: initialValues?.primaryMobileNo || '',
              onChange: (val: any) => (this.manualContactData.primaryMobileNo = val),
              validations: [
                { type: 'required', message: 'Required' },
                {
                  type: 'pattern',
                  value: '^[+]?[0-9][\\s\\-0-9]{8,17}$',
                  message: 'Enter valid mobile (digits only, 10-15 digits)',
                },
              ],
            },
            {
              name: 'secondaryMobileNo',
              label: 'Secondary Mobile',
              type: 'text',
              colSpan: 1,
              value: initialValues?.secondaryMobileNo || '',
              onChange: (val: any) => (this.manualContactData.secondaryMobileNo = val),
              validations: [
                {
                  type: 'pattern',
                  value: '^[0-9]{10,15}$',
                  message: 'Enter valid secondary mobile',
                },
              ],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              options: [
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ],
              value:
                initialValues?.status !== undefined
                  ? UtilityService.normalizeStatus(initialValues.status)
                  : 1,
              onChange: (val: any) => (this.manualContactData.status = val),
              colSpan: 1,
            },
          ],
        },
      ],
    };
  }

  onOvertimeSave() {
    const d = this.manualOvertimeData;
    const requiredFields: { key: string; label: string }[] = [
      { key: 'otDailyLimit', label: 'Daily Limit' },
      { key: 'otWeeklyLimit', label: 'Weekly Limit' },
      { key: 'otMonthlyLimit', label: 'Monthly Limit' },
      { key: 'otQuarterlyLimit', label: 'Quarterly Limit' },
      { key: 'otAnuualyLimit', label: 'Annual Limit' },
      { key: 'overTimeWorkingDay', label: 'Working Days' },
      { key: 'normalOTRate', label: 'Normal Rate Multiplier' },
      { key: 'holidayOTRate', label: 'Holiday Rate Multiplier' },
      { key: 'overtimeConfiguration', label: 'OT Eligibility (minutes)' },
      { key: 'workkingHours', label: 'Branch Work Hours' },
    ];
    const missing = requiredFields.find(f => {
      const num = parseFloat(String(d[f.key]));
      return isNaN(num) || num <= 0;
    });
    if (missing) {
      this.notificationService.showError(`${missing.label} is required.`);
      return;
    }

    // Fixed OT fields are only required when the branch actually opts into Fixed OT.
    if (d.isFixedOTAllowed) {
      const fixedFields: { key: string; label: string }[] = [
        { key: 'fixedOTDailyHours', label: 'Fixed OT Daily Hours' },
        { key: 'fixedOTRate', label: 'Fixed OT Rate Multiplier' },
      ];
      const missingFixed = fixedFields.find(f => {
        const num = parseFloat(String(d[f.key]));
        return isNaN(num) || num <= 0;
      });
      if (missingFixed) {
        this.notificationService.showError(`${missingFixed.label} is required when Fixed OT is allowed.`);
        return;
      }
    }

    // OT Bank fields are only required when the branch actually enables it.
    if (d.isOvertimeBankEnabled) {
      const otBankFields: { key: string; label: string }[] = [
        { key: 'halfDayHoursThreshold', label: 'Half-Day Threshold (Hours)' },
        { key: 'fullDayHoursThreshold', label: 'Full-Day Threshold (Hours)' },
      ];
      const missingOtBank = otBankFields.find(f => {
        const num = parseFloat(String(d[f.key]));
        return isNaN(num) || num <= 0;
      });
      if (missingOtBank) {
        this.notificationService.showError(`${missingOtBank.label} is required when the OT Bank is enabled.`);
        return;
      }
      if (!d.otRedemptionLeaveTypeMasterId) {
        this.notificationService.showError('A Redemption Leave Type is required when the OT Bank is enabled.');
        return;
      }
    }

    this.onOvertimeFormSubmit(d, this.overtimeId);
    this.saveOvertimeBankSetting(d);
  }

  // OT Bank is a separate, ALMS-only table (no HRMSAuthZ/CAB fan-out needed) -
  // saved independently of onOvertimeFormSubmit()'s BranchOvertimeSetting fan-out.
  saveOvertimeBankSetting(d: any): void {
    if (!d.isOvertimeBankEnabled && !this.overtimeBankSettingId) {
      // Never enabled and nothing saved yet - nothing to do.
      return;
    }

    const payload: any = {
      CompanyBranchId: this.companyBranchId,
      OvertimeBankSettingID: this.overtimeBankSettingId || undefined,
      IsEnabled: !!d.isOvertimeBankEnabled,
      HalfDayHoursThreshold: parseFloat(String(d.halfDayHoursThreshold)) || 0,
      FullDayHoursThreshold: parseFloat(String(d.fullDayHoursThreshold)) || 0,
      MaxBalanceHours: d.maxBalanceHours ? (parseFloat(String(d.maxBalanceHours)) || null) : null,
      RedemptionRequiresApproval: d.otBankRedemptionRequiresApproval !== false,
      DispositionMode: d.dispositionMode || 'CarryForwardMonth',
      CarryForwardMaxHours: d.carryForwardMaxHours ? (parseFloat(String(d.carryForwardMaxHours)) || null) : null,
      OtRedemptionLeaveTypeMasterId: d.otRedemptionLeaveTypeMasterId || undefined,
      Status: 1,
    };

    const isUpdate = !!this.overtimeBankSettingId;
    const apiCall = isUpdate
      ? this.reposotory.update('api/AttendenceSource/UpdateOvertimeBankSetting', payload)
      : this.reposotory.post('api/AttendenceSource/CreateOvertimeBankSetting', payload);

    apiCall.subscribe({
      next: () => {
        this.notificationService.showSuccess(`OT Bank setting ${isUpdate ? 'updated' : 'saved'} successfully`);
        this.getBranchOT();
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.showError(
          err.error?.message || err.error?.Message || 'Error saving OT Bank setting'
        );
      },
    });
  }

  onFormValidationError(message: string) {
    this.notificationService.showError(message || 'Please fill all required fields correctly.');
  }

  onContactValidationError(message: string) {
    this.notificationService.showError(message || 'Please fill all required fields correctly.');
  }

  onContactFormSubmit(data: any, id?: string) {
    console.warn('!!! [BRANCH_DETAILS] onContactFormSubmit Fired - v22.4 !!!');
    const finalId = id || this.contactId;
    console.log('[BRANCH_DETAILS] ID:', finalId, 'Data Received:', data);

    if (!data) {
      console.error('[BRANCH_DETAILS] Error: No data received in submit');
      return;
    }

    // Some phone controls return an object instead of a string
    const primaryMobile =
      typeof data.primaryMobileNo === 'object'
        ? data.primaryMobileNo?.number || ''
        : data.primaryMobileNo || '';
    const secondaryMobile =
      typeof data.secondaryMobileNo === 'object'
        ? data.secondaryMobileNo?.number || ''
        : data.secondaryMobileNo || '';

    const payload: any = {
      CompanyBranchId: this.companyBranchId,
      ContactPerson: String(data.contactPerson || '').trim(),
      PrimaryEmailId: String(data.primaryEmailId || '').trim(),
      SecondaryEmailId: String(data.secondaryEmailId || '').trim(),
      PrimaryMobileNo: String(primaryMobile).trim(),
      SecondaryMobileNo: String(secondaryMobile).trim(),
      Status: UtilityService.normalizeStatus(data.status),
    };

    if (finalId) {
      payload.Id = finalId;
    }

    const isUpdate = !!finalId;
    console.log('[BRANCH_DETAILS] Final Payload to API:', payload);
    const apiCall = isUpdate
      ? this.reposotory.update(
        'api/company-branch/UpdateCompanyBranchContactDetail',
        payload,
      )
      : this.reposotory.post(
        'api/company-branch/CreateCompanyBranchContactDetail',
        payload,
      );

    apiCall.subscribe({
      next: (res) => {
        console.log('[BRANCH_DETAILS] API Success:', res);
        this.notificationService.showSuccess(
          `Contact details ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        this.getBranchContact();
      },
      error: (err: HttpErrorResponse) => {
        console.error('[BRANCH_DETAILS] API Error:', err);
        this.notificationService.showError(
          err.error?.message || 'Error saving contact',
        );
      },
    });
  }

  get dataArray(): any[] {
    return this.dataSource;
  }

  handleSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    if (searchTerm) {
      this.dataSource = this.branchContactList.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm),
        ),
      );
    } else {
      this.dataSource = [...this.branchContactList]; // Reset to original data
    }
  }

  onStatutorySubmit(data: any, id?: any) {
    console.log('[BRANCH_DETAILS] onStatutorySubmit started. Data:', data);
    const statutoryId = id || this.statutoryId || this.dataSource1[0]?.id || this.dataSource1[0]?.Id || this.dataSource1[0]?.companyStatutoryIdentityId;
    const statusValue = UtilityService.normalizeStatus(data.status);

    const payload: any = {
      CompanyBranchId: this.companyBranchId,
      CompanyPanNo: data.companyPanNo || '',
      CompanyCinNo: data.companyCinNo || '',
      CompanyPfNo: data.companyPfNo || '',
      CompanyEsiNo: data.companyEsiNo || '',
      CompanyTanNo: data.companyTanNo || '',
      LwfNo: data.lwfNo || '',
      TradeNo: data.tradeNo || '',
      IsEsiIncludeInCTC: data.isEsiIncludeInCTC === 'Yes',
      IsEsiOverridableAtEmployeeLevel: data.isEsiOverridableAtEmployeeLevel === 'Yes',
      IsLwfIncludeInCTC: data.isLwfIncludeInCTC === 'Yes',
      IsLwfOverridableAtEmployeeLevel: data.isLwfOverridableAtEmployeeLevel === 'Yes',
      IsGratuityIncludeInCTC: data.isGratuityIncludeInCTC === 'Yes',
      IsAdminChargesIncludeInCTC: data.isAdminChargesIncludeInCTC === 'Yes',
      PfCalculation:
        data.pfCalculation === 'Max Limit as per Act'
          ? 'Max'
          : data.pfCalculation || 'Max',
      PfCalculationBasis: data.pfCalculationBasis || 'Basic',
      PfCeilingProrateByAttendance: data.pfCeilingProrateByAttendance === 'Yes',
      PfOverridableEmployee: data.pfOverridableEmployee || 'Yes',
      isPfExpensesIncludeInCTC: data.isPfExpensesIncludeInCTC === 'Yes',
      isPfExpensesOverridableAtEmployeeLevel:
        data.isPfExpensesOverridableAtEmployeeLevel === 'Yes',
      Status: statusValue,
    };

    if (statutoryId) {
      payload.Id = statutoryId;
    }

    const isUpdate = !!statutoryId;
    console.log('[BRANCH_DETAILS] Statutory Payload (PascalCase):', payload);

    const apiCall = isUpdate
      ? this.reposotory.update(
        'api/company-branch/UpdateCompanyStatutory',
        payload,
      )
      : this.reposotory.post(
        'api/company-branch/CreateCompanyStatutory',
        payload,
      );

    apiCall.subscribe({
      next: (res) => {
        console.log('[BRANCH_DETAILS] Statutory API Success:', res);
        this.notificationService.showSuccess(
          `Statutory ${isUpdate ? 'updated' : 'created'} successfully`,
        );
        this.getBranchStatutory();
        this.isFormDirty['statutory'] = false;

        // Cascade this branch's PF ceiling proration policy to every employee who hasn't
        // individually overridden it - otherwise only brand-new employees created after
        // this point would ever pick up the change, and every existing employee's record
        // would silently stay stuck at whatever was true when it was last saved.
        this.reposotory
          .update(
            `api/EmployeeMaster/BulkSyncPfCeilingProrateByAttendance?companyBranchId=${this.companyBranchId}&pfCeilingProrateByAttendance=${payload.PfCeilingProrateByAttendance}`,
            {},
          )
          .subscribe({
            next: (syncRes: any) => {
              console.log('[BRANCH_DETAILS] PF ceiling proration bulk sync:', syncRes);
              if (syncRes?.updatedCount > 0) {
                this.notificationService.showSuccess(
                  `Applied to ${syncRes.updatedCount} employee(s) using the company default.`,
                );
              }
            },
            error: (e) => console.error('[BRANCH_DETAILS] PF ceiling proration bulk sync error:', e),
          });
      },
      error: (err) => {
        console.error('[BRANCH_DETAILS] Statutory API Error:', err);
        this.notificationService.showError(
          `Error ${isUpdate ? 'updating' : 'creating'} statutory`,
        );
      },
    });
  }

  getBranchStatutory() {
    this.route.params.subscribe((params) => {
      this.id = params['id'];
    });

    this.reposotory
      .get(`api/company-branch/GetCompanyStatutory/?companyBranchId=${this.id}`)
      .subscribe({
        next: (data) => {
          this.branchStatutoryList = data.map((item: any, index: number) => {
            const pfCalculationValue =
              item.pfCalculation === 'Max'
                ? 'Max Limit as per Act'
                : item.pfCalculation || 'Max Limit as per Act';
            return {
              ...item,
              srNo: index + 1,
              status: UtilityService.normalizeStatus(item.status),
              tradeNumber: item.tradeNumber || '',
              eidNumber: item.eidNumber || '',
              pfCalculation: pfCalculationValue,
              pfOverridableEmployee: UtilityService.statusToYesNo(
                item.pfOverridableEmployee,
              ),
              // Not routed through statusToYesNo() - its underlying normalizeStatus()
              // defaults null/undefined to "Yes" (fine for the older Yes-by-default fields
              // above, wrong here). This is a brand-new nullable field with no legacy data,
              // so an unset value must default to "No" - otherwise every existing branch
              // that has never touched this setting would silently start prorating PF
              // ceilings, changing payroll for clients who never opted in.
              pfCeilingProrateByAttendance:
                item.pfCeilingProrateByAttendance === true ? 'Yes' : 'No',
              isPfExpensesIncludeInCTC: UtilityService.statusToYesNo(
                item.isPfExpensesIncludeInCTC,
              ),
              isPfExpensesOverridableAtEmployeeLevel:
                UtilityService.statusToYesNo(
                  item.isPfExpensesOverridableAtEmployeeLevel,
                ),
            };
          });
          this.dataSource1 = this.branchStatutoryList;
          if (this.dataSource1.length > 0) {
            this.initializeStatutoryConfig(this.dataSource1[0]);
          } else {
            this.initializeStatutoryConfig(null);
          }
        },
        error: (err) => {
          // Without this handler, a failed request left statutoryFormConfig permanently
          // undefined — the form silently rendered as an empty box with no visible error,
          // no way to tell a real failure apart from "this branch just has no statutory
          // record yet". Log it and still initialize a blank editable form so a brand-new
          // company isn't blocked from entering its statutory details for the first time.
          console.error('[BRANCH_DETAILS] Failed to load company statutory details', err);
          this.dataSource1 = [];
          this.initializeStatutoryConfig(null);
        },
      });
  }

  getLeaveEncashment() {
    this.reposotory
      .get(`api/company-branch/GetBranchLeaveEncashment`)
      .subscribe((data: any[]) => {
        // Cast as an array
        // Map directly over 'data', not 'data.data'
        this.branchLeaveEncashmentList = data.map((item: any) => ({
          ...item,
          status: UtilityService.normalizeStatus(item.status),
        }));
        this.dataSource5 = this.branchLeaveEncashmentList;
        // Refresh Form State
        this.initializeFormState('leaveEncashment');
        // Trigger UI Update for FormConfig
        this.leaveEncashmentFormConfig = { ...this.leaveEncashmentFormConfig };
      });
  }

  getEmployeeList(): void {
    this.reposotory.get('api/AttendencesSource/EmployeeBasicDetailList').subscribe({
      next: (data) => {
        this.employeeList = data
          .filter(
            (emp: any) =>
              emp.status === 1 &&
              emp.companyId === this.companyId &&
              emp.companyBranchId === this.companyBranchId,
          )
          .filter(
            (emp: any) =>
              emp.status === 1 &&
              emp.companyId === this.companyId &&
              emp.companyBranchId === this.companyBranchId,
          )
          .map((emp: any) => ({
            id: emp.employeeId,
            employeeId: emp.employeeId,
            code: emp.employeeCode,
            employeeCode: emp.employeeCode,
            employeeFirstName: emp.employeeFirstName,
            employeeMiddleName: emp.employeeMiddleName,
            employeeLastName: emp.employeeLastName,
            name: `${emp.employeeFirstName} ${emp.employeeMiddleName ? emp.employeeMiddleName + ' ' : ''}${emp.employeeLastName}`,
            displayText: `${emp.employeeCode}-${emp.employeeFirstName} ${emp.employeeMiddleName ? emp.employeeMiddleName + ' ' : ''}${emp.employeeLastName}`,
            companyId: emp.companyId,
            companyBranchId: emp.companyBranchId,
            fullData: emp,
          }));
        this.dataSource.forEach((contact: any) => {
          // Case 1: Has employeeId - try to match directly
          if (contact.employeeId) {
            const emp = this.employeeList.find(
              (e) => e.id === contact.employeeId,
            );
            if (emp) {
              contact.selectedEmployee = emp;
              contact.isFreeText = false;
            } else {
              // Employee ID exists but not found in list (maybe deleted)
              // Keep as free-text
              contact.isFreeText = true;
              contact.selectedEmployee = null;
            }
          }
          // Case 2: No employeeId but has contactPerson - try to match by displayText
          else if (contact.contactPerson) {
            const emp = this.employeeList.find(
              (e) => e.displayText === contact.contactPerson,
            );
            if (emp) {
              // Found a match - link to employee
              contact.selectedEmployee = emp;
              contact.employeeId = emp.id;
              contact.isFreeText = false;
            } else {
              // free-text contact — VALUE KO MAT KATNA
              contact.isFreeText = true;
              contact.selectedEmployee = {
                displayText: contact.contactPerson,
                name: contact.contactPerson,
                id: null,
              };
            }
          }
        });
        console.log(
          'Final dataSource after employee linking:',
          this.dataSource,
        );
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching employees:', err);
        this.notificationService.showError('Error loading employees');
      },
    });
  }
  // openAddBranchStatutoryForm(companyBranchId: any) {
  //   const dialogRef = this.dialogForm.open(AddStatutoryComponent, {
  //     height: '80%',
  //     width: '60%',
  //     data: {
  //       companyBranchId: companyBranchId,
  //     },
  //   });
  //   dialogRef.afterClosed().subscribe(() => {
  //     setTimeout(() => {
  //       this.getBranchStatutory();
  //     }, 500);
  //   });
  // }

  // openUpdateBranchStatutoryForm(branchId: any, branchStatutoryId: any) {
  //   const dialogRef = this.dialogForm.open(UpdateStatutoryComponent, {
  //     height: '80%',
  //     width: '60%',
  //     data: {
  //       branchId: branchId,
  //       branchStatutoryId: branchStatutoryId,
  //     },
  //   });

  //   dialogRef.afterClosed().subscribe(() => {
  //     setTimeout(() => {
  //       this.getBranchStatutory();
  //     }, 500);
  //   });
  // }

  get dataArray1(): any[] {
    return this.dataSource1;
  }

  addBranchStatutory(): void {
    this.router.navigate([
      'company/addStatutory',
      this.companyId,
      this.companyBranchId,
    ]);
  }

  onEditStatutoryRow(row: any) {
    if (row.companyBranchId && row.id) {
      this.router.navigate([
        '/company/updateStatutory',
        row.companyBranchId,
        row.id,
      ]);
    }
  }

  deleteBranchStatutory = (row: any) => {
    this.dialogService
      .openConfirmDialog(
        'Delete Branch Statutory',
        'Are you sure you want to delete this branch Statutory',
        'Delete',
        'Cancel',
      )
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reposotory
            .delete(
              `api/company-branch/DeleteCompanyStatutory?Id=${row.id}`,
            )
            .subscribe(() => {
              this.notificationService.showSuccess(
                'Statutory deleted successfully',
              );
              this.getBranchStatutory();
            });
        }
      });
  };

  // openAddTaxDeductorForm(branchId: any) {
  //   const dialogRef = this.dialogForm.open(AddCompanyTaxDeductorComponent, {
  //     height: '80%',
  //     width: '60%',
  //     data: {
  //       branchId: branchId,
  //     },
  //   });
  //   dialogRef.afterClosed().subscribe(() => {
  //     setTimeout(() => {
  //       this.getTaxDeductor();
  //     }, 500);
  //   });
  // }

  // openUpdateTaxDeductorForm(branchId: any, taxDeductorId: any) {
  //   const dialogRef = this.dialogForm.open(UpdateCompanyTaxDeductorComponent, {
  //     height: '80%',
  //     width: '60%',
  //     data: {
  //       branchId: branchId,
  //       taxDeductorId: taxDeductorId,
  //     },
  //   });
  //   dialogRef.afterClosed().subscribe(() => {
  //     setTimeout(() => {
  //       this.getTaxDeductor();
  //     }, 500);
  //   });
  // }

  onEditTaxRow(row: any) {
    if (row.companyBranchId && row.id) {
      this.router.navigate([
        '/company/updateTaxDeductor',
        row.companyBranchId,
        row.id,
      ]);
    }
  }
  getTaxDeductor = () => {
    this.route.params.subscribe((params) => {
      this.id = params['id'];
    });
    this.reposotory
      .get(
        `api/company-branch/GetCompanyTaxDeductor?companyBranchId=${this.id}`,
      )
      .subscribe({
        next: (data) => {
          this.branchTaxList = UtilityService.mapWithSerialNumbers(
            data.map((item: any) => ({
              ...item,
              status: UtilityService.normalizeStatus(item.status),
            })),
          );
          this.dataSource2 = this.branchTaxList;
          // Refresh Form State
          this.initializeFormState('tax');
          // Trigger UI Update for FormConfig
          this.taxDeductorFormConfig = { ...this.taxDeductorFormConfig };
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

  get dataArray2(): any[] {
    return this.dataSource2;
  }

  addBranchTax(): void {
    this.router.navigate([
      'company/addTaxDeductor',
      this.companyId,
      this.companyBranchId,
    ]);
  }

  deleteTaxDeductor = (row: any) => {
    this.dialogService
      .openConfirmDialog(
        'Delete Tax Deductor',
        'Are you sure you want to delete this Tax Deductor',
        'Delete',
        'Cancel',
      )
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reposotory
            .delete(
              `api/CompanyTaxDeductor/DeleteTaxDeductorCompany?guidCompanyTaxDeductorId=${row.id}`,
            )
            .subscribe(() => {
              this.notificationService.showSuccess('Tax deleted successfully');
              this.getTaxDeductor();
            });
        }
      });
  };

  get dataArray5(): any[] {
    return this.dataSource5;
  }

  get dataArray6(): any[] {
    return this.dataSource6;
  }

  onEditLeaveEncashment(row: any) { }

  addLeaveEncashment(): void { }

  addWeeklyOff(): void {
    this.router.navigate([
      'attendance/attedance-module-setup',
      this.companyId,
      this.companyBranchId,
    ]);
  }

  deleteLeaveEncashment = (row: any) => {
    this.dialogService
      .openConfirmDialog(
        'Delete Leave Encashment',
        'Are you sure you want to delete this Leave Encashment setting',
        'Delete',
        'Cancel',
      )
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reposotory
            .delete(
              `api/AttendenceSource/DeleteLeaveEncashment?BranchLeaveId=${row.branchLeaveId}`,
            )
            .subscribe(() => {
              this.notificationService.showSuccess('Deleted successfully');
              this.getLeaveEncashment();
            });
        }
      });
  };

  onEditWeeklyOff(row: any): void { }

  deleteWeeklyOff = (row: any) => {
    this.dialogService
      .openConfirmDialog(
        'Delete Weekly Off Configuration',
        'Are you sure you want to delete this Weekly Off configuration',
        'Delete',
        'Cancel',
      )
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.notificationService.showSuccess('Deleted successfully');
        }
      });
  };
}
