import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { AccountService } from '../../shared/services/account.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UtilityService } from '../../shared/services/utility.service';

@Component({
  selector: 'app-add-company',
  standalone: true,
  imports: [AddUpdateFormComponent, CommonModule],
  templateUrl: './add-company.component.html',
  styleUrls: ['./add-company.component.scss'],
})
export class AddCompanyComponent implements OnInit {
  companyData: any;
  logoPreview: string | null = null;
  companyGroups: any[] = [];
  companies: any[] = [];
  companyId: any;
  companyFormConfig!: FormConfig;
  addCompanyFormLoaded: boolean = false;

  // Preview variables
  selectedDateFormat = 'DD/MM/YYYY';
  selectedTimeFormat = '12-hour';
  selectedTimeDateFormat = 'Hours:Minutes:Seconds';
  selectedTimezone: string = 'IST (Indian Standard Time, UTC+5:30)';
  seprator: string = '/';
  datePreview = '';
  timePreview = '';
  dateTimePreview = '';

  constructor(
    private companiesData: AccountService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // 1. Load dependencies
    this.getCompanyGroup();
    this.getCompanies();
    this.updatePreview();

    // 2. Check route for Edit/Add mode
    this.route.params.subscribe((params) => {
      this.companyId = params['companyId'];

      if (this.companyId) {
        // Edit Mode: Hide form, fetch data
        this.addCompanyFormLoaded = false;
        this.getCompanyData();
      } else {
        // Add Mode: Initialize and show
        this.initializeFormConfig();
        this.addCompanyFormLoaded = true;
      }
    });
  }

  initializeFormConfig(initialValues?: any) {
    const isUpdate = !!this.companyId;

    // Set Preview States if data exists
    if (initialValues) {
      this.selectedDateFormat = initialValues.dateFormat || 'DD/MM/YYYY';
      this.seprator = initialValues.dateFieldSeperator || '/';
      this.selectedTimeFormat = initialValues.timeFormat || '12-hour';
      this.selectedTimeDateFormat = this.convertDisplayFormatToValue(
        initialValues.timeDisplayFormat,
      );
      this.selectedTimezone =
        initialValues.timezone || 'IST (Indian Standard Time, UTC+5:30)';
      this.updatePreview();
    }

    // Prepare initial value for logo
    let initialLogo = '';
    if (initialValues?.companylogo) {
      initialLogo = this.formatLogoData(initialValues.companylogo) || '';
    }

    this.companyFormConfig = {
      formTitle: isUpdate ? 'Update Company' : 'Add Company',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'companylogo',
              label: 'Upload Logo File',
              type: 'file',
              accept: 'image/*',
              colSpan: 5,
              hint: 'Upload employee photo (JPG, PNG)',
              // Pass existing logo so form isn't invalid
              value: '',
              validations: [
                // Only make it required if we don't already have a logo
                { type: 'required', message: 'Company Logo is required' },
              ],
              onChange: (val: any) => {
                // We ignore the error as requested, just capturing value if possible
                console.log('Logo changed:', val);
              },
            },
          ],
        },
        {
          fields: [
            {
              name: 'tCompanyName', // API: companyName
              label: 'Company Name',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              value: initialValues?.companyName || '',
              validations: [
                { type: 'required', message: 'Company Name is required' },
                { type: 'maxLength', value: 50, message: 'Max 50 characters' },
                {
                  type: 'pattern',
                  value: '^[a-zA-Z\\s]*$',
                  message: 'Alphabets only',
                },
                {
                  type: 'custom',
                  message: 'Company Name already exists',
                  validator: (val: any) => this.isNameUnique(val),
                },
                {
                  type: 'custom',
                  message: 'Cannot be empty',
                  validator: (val: any) => (val || '').trim().length > 0,
                },
              ],
            },
            {
              name: 'companyCode',
              label: 'Company Code',
              type: 'text',
              colSpan: 1,
              value: initialValues?.companyCode || '',
              validations: [
                { type: 'required', message: 'Company Code is required' },
                {
                  type: 'custom',
                  message: 'Code exists',
                  validator: (val: any) => this.isCodeUnique(val),
                },
              ],
            },
            {
              name: 'companyGroupId',
              label: 'Company Group',
              type: 'select',
              colSpan: 1,
              value: initialValues?.companyGroupId || '',
              options: this.companyGroups.map((group: any) => ({
                label: group.companyGroupName,
                value: group.id,
              })),
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'tIndustry', // API: industry
              label: 'Industry',
              type: 'text',
              colSpan: 1,
              value: initialValues?.industry || '',
              validations: [
                { type: 'required', message: 'Industry is required' },
                {
                  type: 'custom',
                  message: 'Cannot be empty',
                  validator: (val: any) => (val || '').trim().length > 0,
                },
              ],
            },
          ],
        },
        {
          fields: [
            {
              name: 'tDateFormat', // API: dateFormat
              label: 'Date Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                { label: 'YYYY/DD/MM', value: 'YYYY/DD/MM' },
                { label: 'DD.MM.YYYY', value: 'DD.MM.YYYY' },
                { label: 'DD-MMM-YYYY', value: 'DD-MMM-YYYY' },
                { label: 'YYYY-DD-MM', value: 'YYYY-DD-MM' },
                { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
                { label: 'DD/MM/YY', value: 'DD/MM/YY' },
              ],
              value: initialValues?.dateFormat || 'DD/MM/YYYY',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: string) => {
                this.selectedDateFormat = val;
                this.updatePreview();
              },
            },
            {
              name: 'tDateFieldSeperator', // API: dateFieldSeperator
              label: 'Date Field Separator',
              type: 'select',
              colSpan: 1,
              options: [
                { label: '/', value: '/' },
                { label: '-', value: '-' },
                { label: '.', value: '.' },
              ],
              value: initialValues?.dateFieldSeperator || '/',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: string) => {
                this.seprator = val;
                this.updatePreview();
              },
            },
            {
              name: 'timeformat', // API: timeFormat
              label: 'Time Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: '12-hour', value: '12-hour' },
                { label: '24-hour', value: '24-hour' },
              ],
              value: initialValues?.timeFormat || '12-hour',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: string) => {
                this.selectedTimeFormat = val;
                this.updatePreview();
              },
            },
            {
              name: 'displayFormat', // API: timeDisplayFormat
              label: 'Time Display Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'Hours:Minutes:Seconds', value: 'HH:mm:ss' },
                { label: 'Hours:Minutes', value: 'HH:mm' },
              ],
              value: this.convertDisplayFormatToValue(
                initialValues?.timeDisplayFormat || 'Hours:Minutes:Seconds',
              ),
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: string) => {
                this.selectedTimeDateFormat = val;
                this.updatePreview();
              },
            },
            {
              name: 'timezone',
              label: 'Timezone',
              type: 'select',
              colSpan: 1,
              options: [
                {
                  label: 'UTC (Coordinated Universal Time)',
                  value: 'UTC (Coordinated Universal Time)',
                },
                {
                  label: 'GMT (Greenwich Mean Time)',
                  value: 'GMT (Greenwich Mean Time)',
                },
                {
                  label: 'IST (Indian Standard Time, UTC+5:30)',
                  value: 'IST (Indian Standard Time, UTC+5:30)',
                },
                {
                  label: 'ICT (Indochina Time, UTC+7:00)',
                  value: 'ICT (Indochina Time, UTC+7:00)',
                },
                {
                  label: 'BST (Bangladesh Standard Time, UTC+6:00)',
                  value: 'BST (Bangladesh Standard Time, UTC+6:00)',
                },
                {
                  label: 'CST (China Standard Time, UTC+8:00)',
                  value: 'CST (China Standard Time, UTC+8:00)',
                },
                {
                  label: 'SGT (Singapore Time, UTC+8:00)',
                  value: 'SGT (Singapore Time, UTC+8:00)',
                },
              ],
              value:
                initialValues?.timezone ||
                'IST (Indian Standard Time, UTC+5:30)',
              validations: [{ type: 'required', message: 'Required' }],
              onChange: (val: string) => {
                this.selectedTimezone = val;
                this.updatePreview();
              },
            },
            {
              name: 'adjustForDST',
              label: 'Adjust DST',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              value: initialValues?.adjustForDST ? 'true' : 'false',
              options: [
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ],
              validations: [{ type: 'required', message: 'Required' }],
            },
            {
              name: 'nStatus', // API: status
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              value:
                initialValues?.status !== undefined
                  ? String(initialValues.status)
                  : '1',
              options: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
              ],
            },
          ],
        },
      ],

      submitLabel: isUpdate ? 'Update' : 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data: any) => this.sendCompaniesData(data),
      onCancel: () => this.goBack(),
    };
  }

  getCompanyData() {
    this.companiesData
      .get(`api/company-branch/GetCompany?id=${this.companyId}`)
      .subscribe({
        next: (response: any) => {
          let data;
          if (Array.isArray(response) && response.length > 0) {
            data = response[0];
          } else {
            data = response;
          }
          console.log('Fetched Data:', data);

          // Initialize form with fetched data
          this.initializeFormConfig(data);

          // Force re-render
          this.addCompanyFormLoaded = false;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.addCompanyFormLoaded = true;
            this.cdr.detectChanges();
          }, 50);
        },
        error: (error: HttpErrorResponse) => {
          this.notificationService.showError('Failed to load company data');
        },
      });
  }

  extractLogoString(val: any): string | null {
    if (!val) return null;

    // Case 1: Simple String (Happy Path)
    if (typeof val === 'string') return val;

    // Case 2: Nested in url.changingThisBreaksApplicationSecurity (The reported issue)
    if (val?.url?.changingThisBreaksApplicationSecurity) {
      return val.url.changingThisBreaksApplicationSecurity;
    }

    // Case 3: Direct Sanitized Object
    if (val?.changingThisBreaksApplicationSecurity) {
      return val.changingThisBreaksApplicationSecurity;
    }

    // Case 4: Simple Object with 'url' property as string
    if (val?.url && typeof val.url === 'string') {
      return val.url;
    }

    return null; // Unknown format
  }

  sendCompaniesData(formValues: any) {
    console.log('Submitting Data:', formValues);
    const rawLogo = formValues.companylogo;
    const cleanLogo = this.extractLogoString(rawLogo);

    console.log('Submitting Data. Raw Logo:', rawLogo, 'Cleaned:', cleanLogo);

    const company: any = {
      companyId: this.companyId ?? undefined,
      companyName: String(formValues.tCompanyName || '').trim(),
      industry: String(formValues.tIndustry || '').trim(),
      dateFormat: formValues.tDateFormat,
      dateFieldSeperator: formValues.tDateFieldSeperator,
      status: Number(formValues.nStatus),
      companyCode: String(formValues.companyCode || '').trim(),
      companyGroupId: formValues.companyGroupId,
      timeFormat: formValues.timeformat,
      timezone: formValues.timezone,
      adjustForDST: formValues.adjustForDST === 'true',
      timeDisplayFormat: this.convertValueToDisplayFormat(
        formValues.displayFormat,
      ),
      companylogo: cleanLogo || null,
    };

    const apiUrl = this.companyId
      ? 'api/company-branch/updateCompany'
      : 'api/Company/CreateCompany';

    const apiCall = this.companyId
      ? this.companiesData.update(apiUrl, company)
      : this.companiesData.post(apiUrl, company);

    apiCall.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          this.companyId ? 'Updated Successfully' : 'Saved Successfully',
        );
        this.addCompanyFormLoaded = false;
        setTimeout(() => {
          this.router.navigate(['company/list']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showError(errorMessage);
      },
    });
  }

  // --- Validators (Fixed to ignore self on update) ---
  isNameUnique(enteredName: string): boolean {
    if (!enteredName || !this.companies.length) return true;
    const normalizedName =
      UtilityService.normalizeStringForComparison(enteredName);

    const isDuplicate = this.companies.some((company) => {
      // STRICT ID CHECK: ignore if it is the current company
      if (
        this.companyId &&
        String(company.companyId) === String(this.companyId)
      ) {
        return false;
      }
      return (
        UtilityService.normalizeStringForComparison(company.companyName) ===
        normalizedName
      );
    });

    return !isDuplicate; // True = Valid
  }

  isCodeUnique(enteredCode: string): boolean {
    if (!enteredCode || !this.companies.length) return true;
    const normalizedCode =
      UtilityService.normalizeStringForComparison(enteredCode);

    const isDuplicate = this.companies.some((company) => {
      // STRICT ID CHECK
      if (
        this.companyId &&
        String(company.companyId) === String(this.companyId)
      ) {
        return false;
      }
      return (
        UtilityService.normalizeStringForComparison(company.companyCode) ===
        normalizedCode
      );
    });

    return !isDuplicate;
  }

  // --- Helpers ---
  getCompanyGroup() {
    this.companiesData.get('api/company-branch/GetCompanyGroup').subscribe({
      next: (data: any[]) => {
        this.companyGroups = data.filter((group) => group.status === 1);

        // Update options if form already loaded
        if (this.companyFormConfig?.sections) {
          const grpField = this.companyFormConfig.sections[1].fields.find(
            (f) => f.name === 'companyGroupId',
          );
          if (grpField) {
            grpField.options = this.companyGroups.map((g) => ({
              label: g.companyGroupName,
              value: g.id,
            }));
          }
        }
      },
    });
  }

  getCompanies() {
    this.companiesData.getCompany('api/company-branch/GetCompany').subscribe({
      next: (data: any) => {
        this.companies = data;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  // --- Preview Logic ---
  updatePreview() {
    const currentDate = new Date();
    const separator = this.seprator || '/';

    // Date
    const d = this.pad(currentDate.getDate());
    const m = this.pad(currentDate.getMonth() + 1);
    const y = currentDate.getFullYear();
    const dateFormats: any = {
      'DD/MM/YYYY': `${d}${separator}${m}${separator}${y}`,
      'MM/DD/YYYY': `${m}${separator}${d}${separator}${y}`,
      'YYYY/MM/DD': `${y}${separator}${m}${separator}${d}`,
      'DD-MMM-YYYY': `${d}-${this.getMonthName(currentDate.getMonth())}-${y}`,
    };
    this.datePreview = dateFormats[this.selectedDateFormat] || `${d}/${m}/${y}`;

    // Time
    let hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();
    let timeStr = '';

    if (this.selectedTimeFormat === '12-hour') {
      const suffix = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      timeStr =
        this.selectedTimeDateFormat === 'HH:mm'
          ? `${this.pad(hours)}:${this.pad(minutes)} ${suffix}`
          : `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)} ${suffix}`;
    } else {
      timeStr =
        this.selectedTimeDateFormat === 'HH:mm'
          ? `${this.pad(hours)}:${this.pad(minutes)}`
          : `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }
    this.timePreview = timeStr;
    this.dateTimePreview = `${this.datePreview} ${this.timePreview} ${this.selectedTimezone}`;
  }

  pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
  getMonthName(idx: number): string {
    return [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][idx];
  }

  private formatLogoData(logo: string | null): string | null {
    if (!logo) return null;
    if (logo.startsWith('data:') || logo.startsWith('http')) return logo;
    return `data:image/png;base64,${logo}`;
  }

  private convertDisplayFormatToValue(label: string): string {
    const map: any = {
      'Hours:Minutes:Seconds': 'HH:mm:ss',
      'Hours:Minutes:Second': 'HH:mm:ss',
      'Hours:Minutes': 'HH:mm',
    };
    return map[label] || 'HH:mm:ss';
  }

  private convertValueToDisplayFormat(value: string): string {
    return value === 'HH:mm' ? 'Hours:Minutes' : 'Hours:Minutes:Second';
  }
}
