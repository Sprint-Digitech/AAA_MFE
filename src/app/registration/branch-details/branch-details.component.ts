import { ChangeDetectorRef, Component, Injectable, OnInit, ViewChild } from '@angular/core';
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

  // Manual Data Tracking for Fallback (Internal use)
  manualContactData: any = {};
  manualStatutoryData: any = {};
  manualTaxData: any = {};
  manualAddressData: any = {};
  manualOvertimeData: any = {};
  manualLeaveData: any = {};

  addressId: string | undefined;
  contactId: string | undefined;
  statutoryId: string | undefined;
  taxId: string | undefined;
  overtimeId: string | undefined;
  leaveId: string | undefined;

  addressDataLoaded: boolean = false;
  contactDataLoaded: boolean = false;
  overtimeDataLoaded: boolean = false;
  statutoryDataLoaded: boolean = false;
  taxDataLoaded: boolean = false;
  leaveDataLoaded: boolean = false;

  initializeStatutoryConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeStatutoryConfig - v22.4', initialValues);
    this.manualStatutoryData = { ...initialValues };
    const statutoryId = initialValues?.id || initialValues?.Id || initialValues?.companyBranchStatutoryIdentityId;
    this.statutoryId = statutoryId;
    const isUpdate = !!statutoryId;

    this.statutoryFormConfig = {
      formTitle: isUpdate ? 'Update Statutory Details' : 'New Statutory Details',
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
      formTitle: isUpdate ? 'Update Tax Deductor' : 'New Tax Deductor',
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
      formTitle: isUpdate ? 'Update Leave Encashment' : 'New Leave Encashment',
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
    this.getBranchOT();
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
      formTitle: isUpdate ? 'Update Address' : 'New Address',
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
    this.reposotory.get('api/company-branch/Location?level=country').subscribe({
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
        `api/company-branch/Location?parentLocationId=${countryId}&level=state`,
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
      .get(`api/company-branch/Location?parentLocationId=${stateId}&level=city`)
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
                  `api/company-branch/Location?parentLocationId=${address.countryId}&level=state`,
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
                        `api/company-branch/Location?parentLocationId=${address.stateId}&level=city`,
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

  initializeOvertimeConfig(initialValues?: any) {
    console.log('[BRANCH_DETAILS] initializeOvertimeConfig - Raw Data:', initialValues);
    const otId = initialValues?.branchOvertimeSettingID || initialValues?.BranchOvertimeSettingID || initialValues?.id || initialValues?.Id;
    this.overtimeId = otId || null;
    this.manualOvertimeData = { ...initialValues };
    const isUpdate = !!otId;

    // Use normalizeStatus for reliable 1/0 mapping
    const currentStatus = UtilityService.normalizeStatus(initialValues?.status);
    console.log('[BRANCH_DETAILS] Overtime ID:', otId, 'isUpdate:', isUpdate, 'Normalized Status:', currentStatus);

    this.overtimeFormConfig = {
      formTitle: isUpdate ? 'Update Overtime' : 'New Overtime',
      maxColsPerRow: 4,
      hideSubmit: false,
      hideCancel: false,
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
              placeholder: 'e.g,1=1hours',
              value: initialValues?.otDailyLimit || '',
              validations: [
                { type: 'required', message: 'Required' },
                { type: 'max', value: 24, message: 'Max 24 hrs' },
              ],
            },
            {
              name: 'otWeeklyLimit',
              label: 'Weekly Limit',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g,1=1hours',
              value: initialValues?.otWeeklyLimit || '',
              validations: [
                { type: 'required', message: 'Required' },
                { type: 'max', value: 168, message: 'Max 168 hrs' },
              ],
            },
            {
              name: 'otMonthlyLimit',
              label: 'Monthly Limit',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g,1=1hours',
              value: initialValues?.otMonthlyLimit || '',
              validations: [
                { type: 'required', message: 'Required' },
                { type: 'max', value: 672, message: 'Max 672 hrs' },
              ],
            },
            {
              name: 'otQuarterlyLimit',
              label: 'Quarterly Limit',
              type: 'number',
              placeholder: 'e.g,1=1hours',
              colSpan: 1,
              value: initialValues?.otQuarterlyLimit || '',
              validations: [
                { type: 'required', message: 'Required' },
              ],
            },
            {
              name: 'otAnuualyLimit',
              label: 'Annual Limit',
              type: 'number',
              placeholder: 'e.g,1=1hours',
              colSpan: 1,
              value: initialValues?.otAnuualyLimit || '',
              validations: [
                { type: 'required', message: 'Required' },
              ],
            },
            {
              name: 'overTimeWorkingDay',
              label: 'Working Days',
              type: 'number',
              colSpan: 1,
              placeholder: 'e.g,25 = 25 working days',
              value: initialValues?.overTimeWorkingDay || '',
              validations: [{ type: 'required', message: 'Required' }],
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
              value: initialValues?.normalOTRate || '',
              placeholder: 'e.g., 1.5 = 1.5x Normal Wage',
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'holidayOTRate',
              label: 'Holiday Rate Multiplier',
              type: 'number',
              colSpan: 2,
              value: initialValues?.holidayOTRate || '',
              placeholder: 'e.g., 2.0 = 2x Normal Wage',
              validations: [{ type: 'required', message: 'Required' }],
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
              value: initialValues?.branchOTHoursRule || '',
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'workkingHours',
              label: 'Branch Work Hours',
              type: 'number',
              colSpan: 1,
              value: initialValues?.workkingHours || '',
              validations: [{ type: 'required', message: 'Required' }],
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

    this.reposotory
      .get(
        `api/company-branch/GetBranchOvertimeSetting?branchId=${this.companyBranchId}`,
      )
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            // Edit Mode
            const overtimeData = data[0];
            // // Map API field 'branchOTHoursRule' to our form name 'overtimeConfiguration'
            // overtimeData.overtimeConfiguration =
            //   overtimeData?.branchOTHoursRule;
            this.initializeOvertimeConfig(overtimeData);
          } else {
            // Add Mode
            this.initializeOvertimeConfig(null);
          }
          this.overtimeDataLoaded = true;
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
      NormalOTRateMultiplierBase: 'Normal Wage',
      NormalOTRate: parseFloat(data.normalOTRate) || 1.0,
      HolidayOTRateMultiplierBase: 'Normal Wage',
      HolidayOTRate: parseFloat(data.holidayOTRate) || 1.0,
      BookKeeping: '',
      BranchOTHoursRule: parseFloat(String(data.overtimeConfiguration || 0)) || 0,
      WorkkingHours: parseFloat(String(data.workkingHours || 0)) || 0,
      Status: UtilityService.normalizeStatus(data.status),
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
      formTitle: isUpdate ? 'Update Branch Contact' : 'New Branch Contact',
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
                  value: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$',
                  message: 'Invalid email',
                },
              ],
            },
            {
              name: 'secondaryEmailId',
              label: 'Secondary Email',
              type: 'email',
              colSpan: 1,
              value: initialValues?.secondaryEmailId || '',
              onChange: (val: any) => (this.manualContactData.secondaryEmailId = val),
              validations: [],
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
                  value: '^[0-9]{10,15}$',
                  message: 'Enter valid mobile',
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
              onChange: (val: any) => (this.manualContactData.status = val),
              colSpan: 1,
            },
          ],
        },
      ],
    };
  }

  onContactFormSubmit(data: any, id?: string) {
    console.warn('!!! [BRANCH_DETAILS] onContactFormSubmit Fired - v22.3 !!!');
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
      Id: finalId || undefined,
      CompanyBranchId: this.companyBranchId,
      ContactPerson: String(data.contactPerson || '').trim(),
      PrimaryEmailId: String(data.primaryEmailId || '').trim(),
      SecondaryEmailId: String(data.secondaryEmailId || '').trim(),
      PrimaryMobileNo: String(primaryMobile).trim(),
      SecondaryMobileNo: String(secondaryMobile).trim(),
      Status: UtilityService.normalizeStatus(data.status),
    };

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
      .subscribe((data) => {
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
    this.reposotory.get('api/Employee/EmployeeBasicDetailList').subscribe({
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
        'Delete Branch Contact',
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
        'Delete Branch Contact',
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
