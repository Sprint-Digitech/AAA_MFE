import { Component, Injectable, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { FormConfig, AddUpdateFormComponent } from '@fovestta2/web-angular';
import { AccountService } from '../../shared/services/account.service';
import { DialogService } from '../../shared/services/dialog.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UtilityService } from '../../shared/services/utility.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
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
  imports: [
    CommonModule,
    FormsModule,
    AddUpdateFormComponent,
    MatFormFieldModule,
    MatOptionModule,
  ],
  templateUrl: './branch-details.component.html',
  styleUrls: ['./branch-details.component.scss'],
})
export class BranchDetailsComponent implements OnInit {
  public branchDetails: any;
  public companyBranchId: any;
  public branchContact: any;
  addressFormConfig!: FormConfig;
  addressDataLoaded: boolean = false;
  addressId: string | null = null;
  contactDataLoaded: boolean = false;
  overtimeFormConfig!: FormConfig;
  overtimeDataLoaded: boolean = false;
  overtimeId: string | null = null;
  statutoryFormConfig: FormConfig = {
    formTitle: '', // Hide title if we want to seamlessly integrate, or set 'Statutory Details'
    maxColsPerRow: 4,
    sections: [
      {
        fields: [
          {
            name: 'companyPanNo',
            label: 'PAN No.',
            placeholder: 'e.g. ABCDE1234F',
            type: 'text',
            colSpan: 1,
            validations: [
              { type: 'required', message: 'PAN No. is required' },
              {
                type: 'pattern',
                value: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
                message: 'Invalid PAN format (ABCDE1234F)',
              },
            ],
          },
          {
            name: 'companyCinNo',
            label: 'CIN No.',
            placeholder: 'e.g. L12345AB2023PLC123456',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$',
                message: 'Invalid CIN format',
              },
            ],
          },
          {
            name: 'companyPfNo',
            label: 'PF No.',
            placeholder: 'e.g. AA/BBB/12345/123/1234567',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[A-Z]{2}\/[A-Z]{3}\/[0-9]{5}\/[0-9]{3}\/[0-9]{1,7}$',
                message: 'Invalid PF format (AA/BBB/12345/123/1234567)',
              },
            ],
          },
          {
            name: 'companyEsiNo',
            label: 'ESI No.',
            placeholder: 'e.g. 17 digits',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[0-9]{17}$',
                message: 'ESI must be 17 digits',
              },
            ],
          },
          {
            name: 'companyTanNo',
            label: 'TAN No.',
            placeholder: 'e.g. AAAA99999A',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[A-Z]{4}[0-9]{5}[A-Z]{1}$',
                message: 'Invalid TAN format (AAAA99999A)',
              },
            ],
          },
        ],
      },
      {
        fields: [
          {
            name: 'pfCalculation',
            label: 'PF Calculate On',
            type: 'radio',
            layout: 'horizontal',
            options: [
              { label: 'Max Limit as per Act', value: 'Max Limit as per Act' },
              { label: 'Full', value: 'Full' },
            ],
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
            colSpan: 1,
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
            colSpan: 1,
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
            colSpan: 1,
          },
        ],
      },
      {
        fields: [
          {
            name: 'companyAoCode',
            label: 'AO Code',
            placeholder: 'e.g. DEL W 72 1',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[A-Z]{3}\\s[A-Z]\\s[0-9]{1,3}\\s[0-9]{1,3}$',
                message: 'Invalid AO Code format (DEL W 72 1)',
              },
            ],
          },
          {
            name: 'tradeNumber',
            label: 'Trade No.',
            placeholder: 'e.g. 5-20 alphanumeric',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[A-Z0-9]{5,20}$',
                message: 'Trade No must be 5-20 alphanumeric',
              },
            ],
          },
          {
            name: 'eidNumber',
            label: 'EID No.',
            placeholder: 'e.g. 6-20 alphanumeric',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[A-Z0-9]{6,20}$',
                message: 'Invalid EID format',
              },
            ],
          },
          {
            name: 'companyTdsCircle',
            label: 'TDS Circle',
            placeholder: 'e.g. 3-20 characters',
            type: 'text',
            colSpan: 1,
            validations: [
              {
                type: 'pattern',
                value: '^[A-Z0-9 ()]{3,20}$',
                message: 'Invalid TDS Circle format',
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
            colSpan: 2,
          },
        ],
      },
    ],
    submitLabel: 'Submit',
    cancelLabel: 'Cancel',
    onSubmit: (data) => this.onStatutorySubmit(data),
    onCancel: () => this.cancelChanges('statutory'),
  };

  public updatedStatutoryFormConfig: boolean = false; // Flag to force refresh if needed or just use object mutation

  // Tax Deductor FormConfig
  taxDeductorFormConfig: FormConfig = {
    formTitle: '',
    maxColsPerRow: 5,
    sections: [
      {
        fields: [
          {
            name: 'taxDeductorName',
            label: 'Tax Deductor Name',
            type: 'text',
            allowAlphabetsOnly: true,
            maxLength: 50,
            colSpan: 1,
            placeholder: 'Enter tax deductor name',
            validations: [
              { type: 'required', message: 'Tax Deductor Name is required' },
              { type: 'maxLength', value: 50, message: 'Max 50 characters' },
            ],
          },
          {
            name: 'taxDeductorFatherName',
            label: 'Father Name',
            type: 'text',
            allowAlphabetsOnly: true,
            maxLength: 50,
            colSpan: 1,
            placeholder: 'Enter father name',
            validations: [
              { type: 'maxLength', value: 50, message: 'Max 50 characters' },
            ],
          },
          {
            name: 'taxDeductorDesignation',
            label: 'Designation',
            type: 'text',
            colSpan: 1,
            placeholder: 'Enter designation',
            validations: [
              { type: 'maxLength', value: 100, message: 'Max 100 characters' },
              {
                type: 'pattern',
                value: '^[a-zA-Z\\s\\-]*$',
                message: 'Only alphabets and hyphen allowed',
              },
            ],
          },
          {
            name: 'taxDeductorMobileNo',
            label: 'Mobile No.',
            type: 'phone',
            colSpan: 1,
            placeholder: '10 digit mobile number',
            validations: [
              { type: 'required', message: 'Mobile No. is required' },
              {
                type: 'pattern',
                value: '^\\d{10}$',
                message: 'Enter valid 10 digit phone number',
              },
            ],
          },
          {
            name: 'taxDeductorEmailId',
            label: 'Email',
            type: 'email',
            colSpan: 1,
            placeholder: 'Enter email address',
            validations: [
              { type: 'required', message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ],
          },
          {
            name: 'status',
            label: 'Status',
            type: 'radio',
            layout: 'horizontal',
            colSpan: 2,
            options: [
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ],
          },
        ],
      },
    ],
    submitLabel: 'Submit',
    cancelLabel: 'Cancel',
    onSubmit: (data) => this.onTaxDeductorSubmit(data),
    onCancel: () => this.cancelChanges('tax'),
  };

  // Leave Encashment FormConfig
  leaveEncashmentFormConfig: FormConfig = {
    formTitle: '',
    maxColsPerRow: 5,
    sections: [
      {
        fields: [
          {
            name: 'maxEncashmentDays',
            label: 'Max Encash Days/Year',
            type: 'number',
            // @ts-ignore
            allowNumbersOnly: true,
            colSpan: 1,
            placeholder: 'Enter days',
            validations: [
              { type: 'required', message: 'Max Encash Days is required' },
            ],
          },
          {
            name: 'minLeaveBalance',
            label: 'Min Bal After Encash',
            type: 'number',
            // @ts-ignore
            allowNumbersOnly: true,
            colSpan: 1,
            placeholder: 'Enter min balance',
            validations: [
              { type: 'required', message: 'Min Bal After Encash is required' },
            ],
          },
          {
            name: 'taxExemptionLimit',
            label: 'Tax Exemption Limit',
            type: 'number',
            // @ts-ignore
            allowNumbersOnly: true,
            colSpan: 1,
            placeholder: 'Enter limit',
            validations: [
              { type: 'required', message: 'Tax Exemption Limit is required' },
            ],
          },
          {
            name: 'tdsRate',
            label: 'TDS Rate(%)',
            type: 'number',
            // @ts-ignore
            allowNumbersOnly: true,
            colSpan: 1,
            placeholder: 'Enter rate',
            validations: [
              { type: 'required', message: 'TDS Rate is required' },
            ],
          },
          {
            name: 'remark',
            label: 'Remarks',
            type: 'textarea',
            colSpan: 5,
            placeholder: 'Enter remarks',
            validations: [{ type: 'required', message: 'Remarks is required' }],
          },
          {
            name: 'status',
            label: 'Status',
            type: 'radio',
            layout: 'horizontal',
            colSpan: 5,
            options: [
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ],
          },
        ],
      },
    ],
    submitLabel: 'Submit',
    cancelLabel: 'Cancel',
    onSubmit: (data) => this.onLeaveEncashmentSubmit(data),
    onCancel: () => this.cancelChanges('leaveEncashment'),
  };

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
  contactFormConfig!: FormConfig;
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
    private activeRoute: ActivatedRoute,
    private reposotory: AccountService,
    private dialogService: DialogService,
    public selectedTab: SelectedTabService,
    private dialogForm: MatDialog,
    private expandedPanelService: ExpandedPanelServiceService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
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
      this.companyBranchId = params['companyBranchId'];
      this.branchAddressId = params['id'];
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
    const isUpdate = !!initialValues?.id;
    this.addressId = initialValues?.id || null;

    // Prepare initial options (Countries are already loaded in ngOnInit)
    const countryOptions = this.countries.map((c) => ({
      label: c.locationName,
      value: c.id,
    }));

    // Initial State/City options will be empty initially and populated dynamically
    // unless we pre-load them (handled in getBranchAddress)

    this.addressFormConfig = {
      formTitle: isUpdate ? 'Update Address' : 'Add Branch Address',
      maxColsPerRow: 3, // Adjust layout for address fields
      sections: [
        {
          fields: [
            {
              name: 'countryId',
              label: 'Country',
              type: 'select',
              colSpan: 1,
              options: countryOptions,
              value: initialValues?.countryId || '',
              validations: [
                { type: 'required', message: 'Country is required' },
              ],
              // Trigger State Load on Change
              onChange: (val: any, form: FormGroup) =>
                this.onCountryChangeLib(val, form),
            },
            {
              name: 'stateId',
              label: 'State',
              type: 'select',
              colSpan: 1,
              options: [], // Populated dynamically
              value: initialValues?.stateId || '',
              validations: [{ type: 'required', message: 'State is required' }],
              // Trigger City Load on Change
              onChange: (val: any, form: FormGroup) =>
                this.onStateChangeLib(val, form),
            },
            {
              name: 'cityId',
              label: 'City',
              type: 'select',
              colSpan: 1,
              options: [], // Populated dynamically
              value: initialValues?.cityId || '',
              validations: [{ type: 'required', message: 'City is required' }],
              onChange: (val: any) => this.updateConfigValue('cityId', val),
            },
            {
              name: 'addressLine',
              label: 'Address Line',
              type: 'text',
              colSpan: 2, // Span wider for address text
              value: initialValues?.addressLine || '',
              validations: [
                { type: 'required', message: 'Address is required' },
              ],
            },
            {
              name: 'pinCode',
              label: 'Pincode',
              type: 'number',
              colSpan: 1,
              value: initialValues?.pinCode || '',
              validations: [
                { type: 'required', message: 'Pincode is required' },
                {
                  type: 'pattern',
                  value: '^[0-9]{6}$',
                  message: 'Enter 6 digit pincode',
                },
              ],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 3,
              options: [
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ],
              value:
                initialValues?.status !== undefined
                  ? UtilityService.normalizeStatus(initialValues.status)
                  : 1,
            },
          ],
        },
      ],
      submitLabel: isUpdate ? 'Update Address' : 'Save Address',
      cancelLabel: 'Reset',
      onSubmit: (data) => this.onAddressFormSubmit(data),
      onCancel: () => this.getBranchAddress(), // Reload original data
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

  onAddressFormSubmit(data: any) {
    console.log(data);
    const payload: any = {
      companyBranchId: this.companyBranchId,
      id: this.addressId || undefined,
      countryId: data.countryId,
      stateId: data.stateId,
      cityId: data.cityId,
      addressLine: String(data.addressLine || '').trim(),
      pinCode: String(data.pinCode || '').trim(),
      status: UtilityService.normalizeStatus(data.status),
    };

    const isUpdate = !!this.addressId;
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
      next: () => {
        this.notificationService.showSuccess(
          `Address ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        this.getBranchAddress(); // Refresh
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.showError(
          err.error?.message || 'Error saving address',
        );
      },
    });
  }

  initializeOvertimeConfig(initialValues?: any) {
    const isUpdate = !!initialValues?.branchOvertimeSettingID;
    this.overtimeId = initialValues?.branchOvertimeSettingID || null;

    // Convert status string ('Active'/'Not Active') to 1/0 for the radio button
    const currentStatus =
      initialValues?.status === 'Active'
        ? 1
        : initialValues?.status === 'Not Active'
          ? 0
          : 1;

    this.overtimeFormConfig = {
      formTitle: isUpdate ? 'Update Overtime Config' : 'Add Overtime Config',
      maxColsPerRow: 4,
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
                { type: 'max', value: 2000, message: 'Max 2000 hrs' },
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
                { type: 'max', value: 8000, message: 'Max 8000 hrs' },
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
              label: 'Weekday Rate',
              type: 'number',
              colSpan: 2,
              value: initialValues?.normalOTRate || '',
              placeholder: 'e.g., 1.5 = 1.5x Normal Wage',
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'holidayOTRate',
              label: 'Holiday Rate',
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
                { label: 'Active', value: 1 },
                { label: 'Inactive', value: 0 },
              ],
              value: currentStatus,
            },
          ],
        },
      ],
      submitLabel: isUpdate ? 'Update Overtime' : 'Save Overtime',
      cancelLabel: 'Reset',
      onSubmit: (data) => this.onOvertimeFormSubmit(data),
      onCancel: () => this.getBranchOT(), // Reset to fetched data
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

  onOvertimeFormSubmit(data: any) {
    const payload: any = {
      companyBranchId: this.companyBranchId,
      branchOvertimeSettingID: this.overtimeId || UtilityService.generateGuid(),
      otDailyLimit: String(data.otDailyLimit),
      otWeeklyLimit: String(data.otWeeklyLimit),
      otMonthlyLimit: String(data.otMonthlyLimit),
      otQuarterlyLimit: String(data.otQuarterlyLimit),
      otAnuualyLimit: String(data.otAnuualyLimit),
      overTimeWorkingDay: String(data.overTimeWorkingDay),
      normalOTRateMultiplierBase: 'Normal Wage', // Hardcoded base as per old logic
      normalOTRate: parseFloat(data.normalOTRate) || 0,
      holidayOTRateMultiplierBase: 'Normal Wage', // Hardcoded base
      holidayOTRate: parseFloat(data.holidayOTRate) || 0,
      bookKeeping: '',
      branchOTHoursRule: String(data.overtimeConfiguration), // Map back to API name
      workkingHours: String(data.workkingHours),
      status: data.status,
    };

    const isUpdate = !!this.overtimeId;
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
      next: () => {
        this.notificationService.showSuccess(
          `Overtime ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        this.getBranchOT(); // Refresh data
      },
      error: (err: HttpErrorResponse) => {
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
        const fields = this.taxDeductorFormConfig.sections[0].fields;

        fields.find((f) => f.name === 'taxDeductorName')!.value =
          taxData.taxDeductorName || '';
        fields.find((f) => f.name === 'taxDeductorFatherName')!.value =
          taxData.taxDeductorFatherName || '';
        fields.find((f) => f.name === 'taxDeductorDesignation')!.value =
          taxData.taxDeductorDesignation || '';
        fields.find((f) => f.name === 'taxDeductorMobileNo')!.value =
          taxData.taxDeductorMobileNo || '';
        fields.find((f) => f.name === 'taxDeductorEmailId')!.value =
          taxData.taxDeductorEmailId || '';
        fields.find((f) => f.name === 'status')!.value =
          UtilityService.normalizeStatus(taxData.status);

        // Hide status field if no ID (new record)
        if (!taxData.id) {
          fields.find((f) => f.name === 'status')!.hidden = true;
        }
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
        const fields = this.leaveEncashmentFormConfig.sections[0].fields;

        fields.find((f) => f.name === 'maxEncashmentDays')!.value =
          leaveData.maxEncashmentDays || '';
        fields.find((f) => f.name === 'minLeaveBalance')!.value =
          leaveData.minLeaveBalance || '';
        fields.find((f) => f.name === 'taxExemptionLimit')!.value =
          leaveData.taxExemptionLimit || '';
        fields.find((f) => f.name === 'tdsRate')!.value =
          leaveData.tdsRate || '';
        fields.find((f) => f.name === 'remark')!.value = leaveData.remark || '';
        fields.find((f) => f.name === 'status')!.value =
          UtilityService.normalizeStatus(leaveData.status);

        // Hide status field if no ID (new record)
        if (!leaveData.branchLeaveId) {
          fields.find((f) => f.name === 'status')!.hidden = true;
        }
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
    }
  }

  onFieldChange(section: string): void {
    this.isFormDirty[section] = false;
    if (section === 'tax') {
      this.mobileErrors.tax = this.dataArray2.map((tax) => ({
        mobile: this.validateMobile(tax.taxDeductorMobileNo),
      }));

      this.emailErrors.tax = this.dataArray2.map((tax) =>
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

  onTaxDeductorSubmit(data: any): void {
    // Prepare payload
    const taxDeductor: companyTaxDeductorDto = {
      id: this.dataSource2[0]?.id || UtilityService.generateGuid(),
      companyBranchId: this.companyBranchId,
      taxDeductorName: String(data.taxDeductorName || '').trim(),
      taxDeductorFatherName: String(data.taxDeductorFatherName || '').trim(),
      taxDeductorDesignation: String(data.taxDeductorDesignation || '').trim(),
      taxDeductorMobileNo: String(data.taxDeductorMobileNo || '').trim(),
      taxDeductorEmailId: String(data.taxDeductorEmailId || '').trim(),
      status: UtilityService.normalizeStatus(data.status),
    };

    const isUpdate = !!this.dataSource2[0]?.id;
    const apiUrl = isUpdate
      ? 'api/company-branch/UpdateCompanyTaxDeductor'
      : 'api/company-branch/CreateCompanyTaxDeductor';

    const apiCall = isUpdate
      ? this.reposotory.update(apiUrl, taxDeductor) // Uses PUT
      : this.reposotory.post(apiUrl, taxDeductor); // Uses POST

    apiCall.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          isUpdate
            ? 'Tax Deductor updated successfully'
            : 'Tax Deductor saved successfully',
        );
        this.getTaxDeductor(); // Reload data
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.showError(
          error?.error?.message || 'Error saving Tax Deductor',
        );
      },
    });
  }

  onLeaveEncashmentSubmit(data: any): void {
    const statusValue = UtilityService.normalizeStatus(data.status);
    const payload: any = {
      companyBranchId: String(this.companyBranchId || ''),
      maxEncashmentDays: parseInt(String(data.maxEncashmentDays || '0')) || 0,
      minLeaveBalance: parseInt(String(data.minLeaveBalance || '0')) || 0,
      taxExemptionLimit: parseFloat(String(data.taxExemptionLimit || '0')) || 0,
      tdsRate: parseFloat(String(data.tdsRate || '0')) || 0,
      remark: String(data.remark || ''),
      status: String(statusValue),
    };

    if (this.dataSource5[0]?.branchLeaveId) {
      payload.branchLeaveId = String(this.dataSource5[0].branchLeaveId);
    }

    const isUpdate = !!payload.branchLeaveId;
    const apiEndpoint = isUpdate
      ? 'api/company-branch/UpdateBranchLeaveEncashment'
      : 'api/company-branch/CreateBranchLeaveEncashment';

    const apiCall = isUpdate
      ? this.reposotory.update(apiEndpoint, payload)
      : this.reposotory.post(apiEndpoint, payload);

    apiCall.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `Leave Encashment ${isUpdate ? 'updated' : 'created'} successfully`,
        );
        this.getLeaveEncashment();
      },
      error: (err: HttpErrorResponse) => {
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
                    employeePayload,
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
    this.route.params.subscribe((params) => {
      this.companyId = params['companyId'];
      this.companyBranchId = params['id'];
    });

    this.reposotory
      .getCompany(`api/company-branch/GetCompany?id=${this.companyId}`)
      .subscribe({
        next: (data) => {
          this.details = data;
        },
      });
  };

  public getBranchDetails = () => {
    this.route.params.subscribe((params) => {
      this.companyBranchId = params['companyBranchId'];
      this.id = params['id'];
    });
    this.reposotory
      .get(`api/company-branch/GetCompanyBranch?branchId=${this.id}`)
      .subscribe({
        next: (data) => {
          this.branchDetails = data[0];
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

    this.reposotory
      .get(
        `api/company-branch/GetCompanyBranchContactDetail?companyBranchId=${this.id}`,
      )
      .subscribe({
        next: (data) => {
          // Check if we have at least one contact
          if (data && data.length > 0) {
            // Found existing contact -> Initialize in UPDATE mode
            // We take the first one since requirements say "only one contact person"
            const existingContact = {
              ...data[0],
              status: UtilityService.normalizeStatus(data[0].status),
            };
            this.initializeContactConfig(existingContact);
          } else {
            // No contact found -> Initialize in ADD mode
            this.initializeContactConfig(null);
          }
          this.contactDataLoaded = true;
        },
        error: (err: HttpErrorResponse) => {
          this.notificationService.showError('Error loading contact info');
          // Fallback to empty form on error so user can try adding
          this.initializeContactConfig(null);
          this.contactDataLoaded = true;
        },
      });
  };

  initializeContactConfig(initialValues?: any) {
    const isUpdate = !!initialValues?.id;

    this.contactFormConfig = {
      formTitle: '', // Empty title to blend in, or use 'Branch Contact Details'
      maxColsPerRow: 2,
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
              validations: [
                { type: 'required', message: 'Contact Person is required' },
                {
                  type: 'maxLength',
                  value: 100,
                  message: 'Max 100 characters',
                },
              ],
            },
            {
              name: 'primaryEmailId',
              label: 'Primary Email',
              type: 'email',
              colSpan: 1,
              value: initialValues?.primaryEmailId || '',
              validations: [
                { type: 'required', message: 'Primary Email is required' },
                { type: 'email', message: 'Enter a valid email' },
              ],
            },
            {
              name: 'secondaryEmailId',
              label: 'Secondary Email',
              type: 'email',
              colSpan: 1,
              value: initialValues?.secondaryEmailId || '',
              validations: [{ type: 'email', message: 'Enter a valid email' }],
            },
            {
              name: 'primaryMobileNo',
              label: 'Primary Mobile',
              type: 'phone',
              colSpan: 1,
              value: initialValues?.primaryMobileNo || '',
              validations: [
                { type: 'required', message: 'Primary Mobile is required' },
                {
                  type: 'pattern',
                  value: '^[0-9]{10}$',
                  message: 'Enter 10 digit number',
                },
              ],
            },
            {
              name: 'secondaryMobileNo',
              label: 'Secondary Mobile',
              type: 'phone',
              colSpan: 1,
              value: initialValues?.secondaryMobileNo || '',
              validations: [
                {
                  type: 'pattern',
                  value: '^[0-9]{10}$',
                  message: 'Enter 10 digit number',
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
              // Default to 1 (Active) if new, otherwise use existing
              value:
                initialValues?.status !== undefined ? initialValues.status : 1,
              colSpan: 2,
            },
          ],
        },
      ],
      submitLabel: isUpdate ? 'Update Details' : 'Save Details',
      cancelLabel: 'Reset', // Since there is no table to go back to, Cancel acts as Reset
      onSubmit: (data) => this.onContactFormSubmit(data, initialValues?.id),
      onCancel: () => {
        // Reset form to its initial state (fetched from API)
        this.initializeContactConfig(initialValues);
      },
    };
  }

  onContactFormSubmit(data: any, id?: string) {
    const payload: any = {
      companyBranchId: this.companyBranchId,
      id: id || undefined,
      contactPerson: String(data.contactPerson || '').trim(),
      primaryEmailId: String(data.primaryEmailId || '').trim(),
      secondaryEmailId: String(data.secondaryEmailId || '').trim(),
      primaryMobileNo: String(data.primaryMobileNo || '').trim(),
      secondaryMobileNo: String(data.secondaryMobileNo || '').trim(),
      status: UtilityService.normalizeStatus(data.status),
    };

    const isUpdate = !!id;
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
      next: () => {
        this.notificationService.showSuccess(
          `Contact details ${isUpdate ? 'updated' : 'saved'} successfully`,
        );
        // Refresh data to ensure ID is captured if we just created a new one
        this.getBranchContact();
      },
      error: (err: HttpErrorResponse) => {
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

  onStatutorySubmit(data: any) {
    const statusValue = Number(data.status);

    const payload: any = {
      companyBranchId: this.id,
      companyPanNo: data.companyPanNo || '',
      companyCinNo: data.companyCinNo || '',
      companyPfNo: data.companyPfNo || '',
      companyEsiNo: data.companyEsiNo || '',
      companyTanNo: data.companyTanNo || '',
      companyTdsCircle: data.companyTdsCircle || '',
      companyAoCode: data.companyAoCode || '',
      tradeNumber: data.tradeNumber || '',
      eidNumber: data.eidNumber || '',
      pfCalculation:
        data.pfCalculation === 'Max Limit as per Act'
          ? 'Max'
          : data.pfCalculation || 'Max',
      pfOverridableEmployee: data.pfOverridableEmployee || 'Yes',
      isPfExpensesIncludeInCTC: data.isPfExpensesIncludeInCTC === 'Yes',
      isPfExpensesOverridableAtEmployeeLevel:
        data.isPfExpensesOverridableAtEmployeeLevel === 'Yes',
      status: statusValue,
    };

    // Add id only if it exists (update scenario)
    if (this.dataSource1.length > 0 && this.dataSource1[0].id) {
      payload.id = this.dataSource1[0].id;
    }

    const statutoryPayload: statutoryDto = payload as statutoryDto;
    const isUpdate = !!payload.id;
    const apiCall = isUpdate
      ? this.reposotory.update(
        'api/company-branch/UpdateCompanyStatutory',
        statutoryPayload,
      )
      : this.reposotory.post(
        'api/company-branch/CreateCompanyStatutory',
        statutoryPayload,
      );

    apiCall.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `Statutory ${isUpdate ? 'updated' : 'created'} successfully`,
        );
        this.getBranchStatutory();
        this.isFormDirty['statutory'] = false;
      },
      error: (err) => {
        this.notificationService.showError(
          `Error ${isUpdate ? 'updating' : 'creating'} statutory`,
        );
        console.error(err);
      },
    });
  }

  getBranchStatutory() {
    this.activeRoute.params.subscribe((params) => {
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
          this.originalData['statutory'] = UtilityService.deepClone(
            this.dataSource1[0],
          );

          // Populate FormConfig
          const statutory = this.dataSource1[0];

          const updateField = (name: string, value: any) => {
            for (const section of this.statutoryFormConfig.sections) {
              const field = section.fields.find((f) => f.name === name);
              if (field) {
                field.value = value;
                return;
              }
            }
          };

          updateField('companyPanNo', statutory.companyPanNo);
          updateField('companyCinNo', statutory.companyCinNo);
          updateField('companyPfNo', statutory.companyPfNo);
          updateField('companyTanNo', statutory.companyTanNo);
          updateField('pfCalculation', statutory.pfCalculation);
          updateField('pfOverridableEmployee', statutory.pfOverridableEmployee);
          updateField(
            'isPfExpensesIncludeInCTC',
            statutory.isPfExpensesIncludeInCTC,
          );
          updateField(
            'isPfExpensesOverridableAtEmployeeLevel',
            statutory.isPfExpensesOverridableAtEmployeeLevel,
          );
          updateField('companyEsiNo', statutory.companyEsiNo);
          updateField('companyAoCode', statutory.companyAoCode);
          updateField('tradeNumber', statutory.tradeNumber);
          updateField('eidNumber', statutory.eidNumber);
          updateField('companyTdsCircle', statutory.companyTdsCircle);
          // Handle status conversion back to 1/0 for radio
          const statusVal =
            statutory.status === 'Active' || statutory.status === 1 ? 1 : 0;
          updateField('status', statusVal);

          // trigger update
          this.statutoryFormConfig = { ...this.statutoryFormConfig };
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
    this.activeRoute.params.subscribe((params) => {
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
