import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { AccountService } from '../../shared/services/account.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UtilityService } from '../../shared/services/utility.service';

@Component({
  selector: 'app-add-company',
  standalone: true,
  imports: [AddUpdateFormComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './add-company.component.html',
  styleUrls: ['./add-company.component.scss'],
})
export class AddCompanyComponent implements OnInit {
  @ViewChild('logoFileInput') logoFileInput?: ElementRef<HTMLInputElement>;

  companyForm = new FormGroup({
    tCompanyName: new FormControl(''),
    companyCode: new FormControl(''),
    companyGroupId: new FormControl(''),
    tIndustry: new FormControl(''),
    nStatus: new FormControl('1'),
  });

  companyData: any;
  logoPreview: string | null = null;
  logoError: boolean = false;
  companyGroups: any[] = [];
  companies: any[] = [];
  companyId: any;
  companyFormConfig!: FormConfig;
  addCompanyFormLoaded: boolean = false;

  constructor(
    private companiesData: AccountService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.companyId = params['companyId'];
      this.addCompanyFormLoaded = false;
      this.loadDependenciesAndInit();
    });
  }

  private loadDependenciesAndInit(): void {
    forkJoin({
      groups: this.companiesData.get('api/company-branch/GetCompanyGroup').pipe(catchError(() => of([]))),
      companies: this.companiesData.getCompany('api/company-branch/GetCompany').pipe(catchError(() => of([]))),
    }).subscribe(({ groups, companies }: any) => {
      this.companyGroups = (groups as any[]).filter((g: any) => g.status === 1);
      this.companies = companies as any[];

      if (this.companyId) {
        this.getCompanyData();
      } else {
        this.initializeFormConfig();
        this.addCompanyFormLoaded = true;
      }
    });
  }

  initializeFormConfig(initialValues?: any) {
    const isUpdate = !!this.companyId;

    // Set logoPreview from existing data (used by the custom uploader in template)
    this.logoPreview = initialValues?.companylogo
      ? (this.formatLogoData(initialValues.companylogo) || null)
      : null;
    this.logoError = false;

    this.companyFormConfig = {
      formTitle: isUpdate ? 'Update Company' : 'Add Company',
      maxColsPerRow: 5,
      sections: [
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
    // Validate logo for new companies
    if (!this.companyId && !this.logoPreview) {
      this.logoError = true;
      return;
    }

    const company: any = {
      companyId: this.companyId ?? undefined,
      companyName: String(formValues.tCompanyName || '').trim(),
      industry: String(formValues.tIndustry || '').trim(),
      status: Number(formValues.nStatus),
      companyCode: String(formValues.companyCode || '').trim(),
      companyGroupId: formValues.companyGroupId,
      companylogo: this.logoPreview || null,
    };

    const apiUrl = this.companyId
      ? 'api/company-branch/updateCompany'
      : 'api/company-branch/CreateCompany';

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

  // --- Logo Upload Handlers ---
  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
        this.logoError = false;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  openLogoPicker(): void {
    this.logoFileInput?.nativeElement.click();
  }

  removeLogo() {
    this.logoPreview = null;
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

  private formatLogoData(logo: string | null): string | null {
    if (!logo) return null;
    if (logo.startsWith('data:') || logo.startsWith('http')) return logo;
    return `data:image/png;base64,${logo}`;
  }
}
