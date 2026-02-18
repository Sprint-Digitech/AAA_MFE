import {
  HttpErrorResponse,
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormControl,
  AsyncValidatorFn,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { UtilityService } from '../../shared/services/utility.service';
import { AccountService } from '../../shared/services/account.service';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { map, catchError, takeUntil, finalize } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';
import { ViewChildren, QueryList } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { Location } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// import { DobValidationComponent } from '../validation/dob-validation/dob-validation.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
// import { ValidationMessagesNemoComponent, ValidationMessagesNemoModule } from 'validation-messages-nemo';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { NemoNumericValueComponent } from 'nemo-numeric-value-fovestta';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  FvDropdownComponent,
  FvEmailFieldComponent,
  FvEntryFieldComponent,
  FvPasswordFieldComponent,
  FvPhoneFieldComponent,
} from '@fovestta2/web-angular';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatCardModule,
    GoogleSigninButtonModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatProgressBarModule,
    // Library form components
    FvEntryFieldComponent,
    FvEmailFieldComponent,
    FvPhoneFieldComponent,
    FvPasswordFieldComponent,
    FvDropdownComponent,
  ],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent implements OnInit, AfterViewInit, OnDestroy {
  accountFormGroup!: FormGroup;
  companyFormGroup!: FormGroup;
  packageFormGroup!: FormGroup;
  reviewFormGroup!: FormGroup;

  isCompleted = false;
  currentStep = 1;
  userEmail: any;

  // Variables to control password visibility
  showPassword = false;
  showConfirmPassword = false;

  // Add these properties
  showTermsModal = false;
  showPrivacyModal = false;

  // Loading state to prevent multiple submissions
  isSubmitting = false;
  industryOptions = [
    'Healthcare',
    'Technology',
    'Manufacturing',
    'Finance',
    'Education',
    'Retail',
  ];

  employeeCountOptions: string[] = ['1-10', '11-50', '51-200', '200+'];

  // Convert to dropdown options format
  get employeeCountOptionsForDropdown() {
    return this.employeeCountOptions.map((count) => ({
      label: count,
      value: count,
    }));
  }

  get industryOptionsForDropdown() {
    return this.industryOptions.map((industry) => ({
      label: industry,
      value: industry,
    }));
  }

  get dateFormatOptionsForDropdown() {
    return [
      { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
      { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
      { label: 'YYYY.DD.MM', value: 'YYYY/DD/MM' },
      { label: 'DD.MM.YYYY', value: 'DD.MM.YYYY' },
      { label: 'DD-MMM-YYYY', value: 'DD-MMM-YYYY' },
      { label: 'YYYY-DD-MM', value: 'YYYY-DD-MM' },
      { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
      { label: 'DD/MM/YY', value: 'DD/MM/YY' },
    ];
  }

  get dateSeparatorOptionsForDropdown() {
    return [
      { label: '/', value: '/' },
      { label: '-', value: '-' },
      { label: '.', value: '.' },
    ];
  }

  get timeFormatOptionsForDropdown() {
    return [
      { label: '12-hour', value: '12-hour' },
      { label: '24-hour', value: '24-hour' },
    ];
  }

  get timezoneOptionsForDropdown() {
    return [
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
        label: 'ICT (Indochina Time - UTC+7:00)',
        value: 'ICT (Indochina Time - UTC+7:00)',
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
    ];
  }

  get displayFormatOptionsForDropdown() {
    return [
      { label: 'Hours:Minutes:Seconds', value: 'Hours:Minutes:Seconds' },
      { label: 'Hours:Minutes', value: 'Hours:Minutes' },
    ];
  }

  selectedPackage = 'starter';

  // Decryption properties
  private readonly baseSecret = 'nV7$A2r8kQ!zD5m^XpT4#eWgU1@bY9sL';
  private decryptedData: any = null;
  @ViewChildren(MatFormField) matFormFields!: QueryList<MatFormField>;

  // Subscription management
  private destroy$ = new Subject<void>();
  private registrationSubscription?: Subscription;

  constructor(
    private _formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private location: Location
  ) { }

  ngOnInit() {
    this.initializeForms();
    // Ensure forms are not marked as touched on initialization
    this.accountFormGroup.markAsUntouched();
    this.companyFormGroup.markAsUntouched();
    this.markFormAsPristine(this.accountFormGroup);
    // Try to decrypt and populate data if available
    this.tryDecryptAndPopulateData();
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }
  ngAfterViewInit() {
    setTimeout(() => {
      // Force outline render
      const fields = document.querySelectorAll(
        'mat-form-field.force-render-field'
      );
      fields.forEach((field: any) => {
        field.floatLabel = 'never'; // Disable label permanently
      });
      this.cdr.detectChanges();
    }, 50);
  }
  goBack(): void {
    this.location.back();
  }

  private markFormAsPristine(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsPristine();
        control.markAsUntouched();
      }
    });
  }

  ngOnDestroy(): void {
    console.log(
      'RegisterUserComponent destroying, isSubmitting:',
      this.isSubmitting
    );

    // Complete the destroy subject to trigger takeUntil in all subscriptions
    // (but NOT for critical operations like registration)
    this.destroy$.next();
    this.destroy$.complete();

    // For critical operations like registration, don't unsubscribe during submission
    // This allows the request to complete even if component is destroyed
    // The subscription will be cleaned up automatically when it completes
    // Only unsubscribe if we're not currently submitting
    if (this.registrationSubscription && !this.isSubmitting) {
      console.log('Unsubscribing from registration (not currently submitting)');
      this.registrationSubscription.unsubscribe();
    } else if (this.isSubmitting) {
      console.warn(
        'Component destroyed during registration - request will continue to complete'
      );
    }
  }

  private tryDecryptAndPopulateData(): void {
    const encryptedData = this.route.snapshot.queryParams['data'];
    if (!encryptedData) {
      return;
    }

    // Prevent navigation if registration is in progress
    if (this.isSubmitting) {
      this.notificationService.showInfo(
        'Please wait for registration to complete'
      );
      return;
    }
    if (this.attemptDecryption(encryptedData, this.getPreviousTimeBasedKey())) {
      return;
    }

    if (this.attemptDecryption(encryptedData, this.getNextTimeBasedKey())) {
      return;
    }

    this.notificationService.showInfo('Could not load pre-filled data');
  }

  private attemptDecryption(encryptedData: string, key: string): boolean {
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(
        decodeURIComponent(encryptedData),
        key
      );
      const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        return false;
      }

      this.decryptedData = JSON.parse(decryptedText);
      sessionStorage.setItem('tenantSchema', 'demo');
      localStorage.setItem('tenantSchema', 'demo');

      this.populateFormFieldsSafely();
      return true;
    } catch (error) {
      return false;
    }
  }

  private getTimeBasedKey(): string {
    const now = new Date();
    const slot = Math.floor(now.getTime() / (10 * 60 * 1000));
    return CryptoJS.SHA256(this.baseSecret + slot).toString();
  }

  private getPreviousTimeBasedKey(): string {
    const now = new Date();
    const prevSlot = Math.floor(now.getTime() / (10 * 60 * 1000)) - 1;
    return CryptoJS.SHA256(this.baseSecret + prevSlot).toString();
  }

  private getNextTimeBasedKey(): string {
    const now = new Date();
    const nextSlot = Math.floor(now.getTime() / (10 * 60 * 1000)) + 1;
    return CryptoJS.SHA256(this.baseSecret + nextSlot).toString();
  }

  // Enhanced form population with better field mapping
  private populateFormFieldsSafely(): void {
    if (!this.decryptedData || !this.accountFormGroup) {
      return;
    }

    try {
      const formData: any = {};

      // Map each field safely with multiple possible property names
      const fieldMappings = [
        {
          formField: 'firstName',
          dataFields: ['firstName', 'first_name', 'fname'],
        },
        {
          formField: 'lastName',
          dataFields: ['lastName', 'last_name', 'lname'],
        },
        {
          formField: 'email',
          dataFields: ['email', 'work_email', 'emailAddress'],
        },
        {
          formField: 'phoneNumber',
          dataFields: ['phoneNumber', 'phone_number', 'phone', 'mobile'],
        },
        {
          formField: 'companyName',
          dataFields: ['companyName', 'company_name', 'company'],
        },
        {
          formField: 'designationName',
          dataFields: ['designationName', 'designation', 'title', 'position'],
        },
        {
          formField: 'employees',
          dataFields: [
            'employees',
            'employee_count',
            'numberOfEmployees',
            'company_size',
          ],
        },
      ];

      fieldMappings.forEach((mapping) => {
        const value = this.findValueInData(mapping.dataFields);
        if (value) {
          formData[mapping.formField] = value;
        }
      });

      // Special handling for email
      if (formData.email) {
        this.userEmail = formData.email;
      }
      this.markFormAsPristine(this.accountFormGroup);

      // Only patch values that actually exist in the decrypted data
      if (Object.keys(formData).length > 0) {
        this.accountFormGroup.patchValue(formData, { emitEvent: false });
        if (this.decryptedData?.password) {
          const pwd = this.accountFormGroup.get('password');
          const cpwd = this.accountFormGroup.get('confirmPassword');
          pwd?.setValue(this.decryptedData.password, { emitEvent: false });
          cpwd?.setValue(this.decryptedData.password, { emitEvent: false });
          pwd?.markAsPristine();
          pwd?.markAsUntouched();
          cpwd?.markAsPristine();
          cpwd?.markAsUntouched();
        }
        // Trigger change detection after patching values
        this.cdr.detectChanges();

        this.notificationService.showSuccess(
          `Form pre-filled with ${Object.keys(formData).length} fields`
        );
      } else {
      }
    } catch (error) {
      this.notificationService.showError('Failed to populate form');
      this.notificationService.showError('Error populating form fields');
    }
  }

  // Helper method to find value in decrypted data using multiple field names
  private findValueInData(fieldNames: string[]): any {
    for (const fieldName of fieldNames) {
      if (this.decryptedData[fieldName]) {
        return this.decryptedData[fieldName];
      }
    }
    return null;
  }
  phoneNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const phoneRegex = /^[0-9]{10}$/;
      const valid = phoneRegex.test(control.value);
      return valid ? null : { invalidPhone: true };
    };
  }
  passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';
      const errors: any = {};

      if (value.length < 8) errors.minLength = true;
      if (!/[A-Z]/.test(value)) errors.uppercase = true;
      if (!/[a-z]/.test(value)) errors.lowercase = true;
      if (!/[0-9]/.test(value)) errors.number = true;
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.specialChar = true;

      return Object.keys(errors).length ? errors : null;
    };
  }

  getPasswordErrorMessage(): string {
    const control = this.accountFormGroup.get('password');
    if (control?.hasError('required')) return 'Password required';
    if (control?.hasError('minLength')) return 'Min 8 characters required';
    if (control?.hasError('specialChar')) return 'Special character required';
    if (control?.hasError('uppercase')) return 'Uppercase letter required';
    if (control?.hasError('number')) return 'Number required';
    return '';
  }

  // Rest of your existing methods remain unchanged...
  initializeForms() {
    this.accountFormGroup = this._formBuilder.group(
      {
        // firstName: ['', Validators.required],
        // lastName: ['', Validators.required],
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: [
          '',
          {
            validators: [Validators.required],
            asyncValidators: [this.emailExistsValidator()],
            updateOn: 'blur',
          },
        ],
        designationName: ['', Validators.required],
        employees: ['', Validators.required],
        phoneNumber: ['', [Validators.required, this.phoneNumberValidator()]],
        companyName: [
          '',
          {
            validators: [
              Validators.required,
              Validators.pattern('^[a-zA-Z .&-]+$'),
            ],
            asyncValidators: [this.companyNameExistsValidator()],
            updateOn: 'blur',
          },
        ],
        password: [
          '',
          {
            validators: [Validators.required, this.passwordStrengthValidator()],
            updateOn: 'blur',
          },
        ],

        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );

    this.companyFormGroup = this._formBuilder.group({
      industry: ['', Validators.required],
      website: [''],
      country: ['India'],
      city: [''],
      dateFormat: ['DD/MM/YYYY'],
      tDateFieldSeperator: ['/'],
      timeformat: ['12-hour'],
      timezone: ['IST (Indian Standard Time, UTC+5:30)'],
      displayFormat: ['Hours:Minutes:Seconds'],
    });

    this.packageFormGroup = this._formBuilder.group({
      package: ['starter', Validators.required],
    });

    this.reviewFormGroup = this._formBuilder.group({
      confirmTerms: [false, Validators.requiredTrue],
    });
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  // Getters for form controls (cast to FormControl for library components)
  get firstNameControl() {
    return this.accountFormGroup.get('firstName') as FormControl;
  }
  get lastNameControl() {
    return this.accountFormGroup.get('lastName') as FormControl;
  }
  get emailControl() {
    return this.accountFormGroup.get('email') as FormControl;
  }
  get phoneNumberControl() {
    return this.accountFormGroup.get('phoneNumber') as FormControl;
  }
  get companyNameControl() {
    return this.accountFormGroup.get('companyName') as FormControl;
  }
  get employeesControl() {
    return this.accountFormGroup.get('employees') as FormControl;
  }
  get designationNameControl() {
    return this.accountFormGroup.get('designationName') as FormControl;
  }
  get passwordControl() {
    return this.accountFormGroup.get('password') as FormControl;
  }
  get confirmPasswordControl() {
    return this.accountFormGroup.get('confirmPassword') as FormControl;
  }

  // Step 2: Company Details getters
  get industryControl() {
    return this.companyFormGroup.get('industry') as FormControl;
  }
  get websiteControl() {
    return this.companyFormGroup.get('website') as FormControl;
  }
  get countryControl() {
    return this.companyFormGroup.get('country') as FormControl;
  }
  get cityControl() {
    return this.companyFormGroup.get('city') as FormControl;
  }
  get dateFormatControl() {
    return this.companyFormGroup.get('dateFormat') as FormControl;
  }
  get dateSeparatorControl() {
    return this.companyFormGroup.get('tDateFieldSeperator') as FormControl;
  }
  get timeFormatControl() {
    return this.companyFormGroup.get('timeformat') as FormControl;
  }
  get timezoneControl() {
    return this.companyFormGroup.get('timezone') as FormControl;
  }
  get displayFormatControl() {
    return this.companyFormGroup.get('displayFormat') as FormControl;
  }

  // Step 3: Review getters
  get confirmTermsControl() {
    return this.reviewFormGroup.get('confirmTerms') as FormControl;
  }

  // Legacy getters (keep for existing code)
  get password() {
    return this.accountFormGroup.get('password');
  }
  get phone() {
    return this.accountFormGroup.get('phoneNumber');
  }
  get email() {
    return this.accountFormGroup.get('email');
  }

  passwordMatchValidator = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const Password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return Password === confirmPassword ? null : { passwordMismatch: true };
  };

  togglePasswordVisibility(field: string): void {
    if (field === 'current') {
      this.showPassword = !this.showPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
  disablePaste(event: ClipboardEvent) {
    event.preventDefault();
  }

  openTermsModal() {
    this.showTermsModal = true;
  }

  openPrivacyModal() {
    this.showPrivacyModal = true;
  }

  closeTermsModal() {
    this.showTermsModal = false;
  }

  closePrivacyModal() {
    this.showPrivacyModal = false;
  }

  selectPackage(packageType: string) {
    this.selectedPackage = packageType;
    this.packageFormGroup.get('package')?.setValue(packageType);
  }

  getStepState(step: number): string {
    if (this.isCompleted) {
      return 'done';
    }
    if (step === this.currentStep) {
      return 'edit';
    }
    if (step < this.currentStep) {
      return 'done';
    }
    return 'number';
  }

  generateCompanyCode(companyName: string) {
    if (typeof companyName !== 'string' || companyName.length < 2) {
      throw new Error('Company name must be at least 2 characters long');
    }
    const prefix = companyName.slice(0, 2).toUpperCase();
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    const numberStr = randomNumber.toString().padStart(3, '0');
    return prefix + numberStr;
  }

  /**
   * Generates a unique tenant schema from company name
   * Uses more characters and a hash to ensure uniqueness
   */
  generateTenantSchema(companyName: string): string {
    if (
      !companyName ||
      typeof companyName !== 'string' ||
      companyName.trim().length < 2
    ) {
      return 'dbo';
    }

    // Clean the company name: remove special characters, spaces, convert to lowercase
    const cleanName = companyName
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    if (cleanName.length < 2) {
      return 'dbo';
    }

    // Take first 6 characters and last 4 characters (or more if name is short)
    const nameLength = cleanName.length;
    let prefix: string;
    let suffix: string;

    if (nameLength <= 10) {
      // For short names, use all characters
      prefix = cleanName.slice(0, Math.min(6, nameLength));
      suffix = cleanName.slice(-Math.min(4, nameLength));
    } else {
      // For longer names, use first 6 and last 4
      prefix = cleanName.slice(0, 6);
      suffix = cleanName.slice(-4);
    }

    // Generate a short hash from the full company name to add uniqueness
    // Using a simple hash function to get consistent results
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) {
      const char = companyName.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive hex string and take first 4 characters
    const hashStr = Math.abs(hash).toString(16).slice(0, 4).padStart(4, '0');

    return `${prefix}${suffix}${hashStr}`;
  }

  sendCompaniesData = (
    data: any,
    companyName: string,
    onComplete?: () => void
  ) => {
    const formValues = { ...data };
    const company: any = {
      id: UtilityService.generateGuid(),
      companyGroupName: companyName,
      email: this.userEmail,
      companyId: UtilityService.generateGuid(),
      companyName: companyName,
      companyCode: this.generateCompanyCode(companyName),
      industry: formValues.industry,
      dateFormat: formValues.dateFormat,
      dateFieldSeperator: formValues.tDateFieldSeperator,
      timeformat: formValues.timeformat,
      timeDisplayFormat: formValues.displayFormat?.trim().substring(0, 20),
      timezone: formValues.timezone,
      scheam: this.decryptedData
        ? 'demo'
        : this.generateTenantSchema(companyName),
      status: 1,
    };

    const headers = new HttpHeaders({
      'x-tenant-schema': 'dbo',
    });

    // For critical operations like company registration, don't use takeUntil
    // This ensures the request completes even if component is destroyed
    this.accountService
      .post('api/Account/CreatCompanyRegitration', company, headers)
      .pipe(
        finalize(() => {
          console.log('Company registration request finalized');
        })
      )
      .subscribe({
        next: (dataSent: any) => {
          console.log('Company registration successful:', dataSent);
          if (dataSent === null) {
            this.notificationService.showSuccess('Company saved successfully');
            localStorage.setItem('dateSeparator', JSON.stringify(company));
            localStorage.setItem('tenantSchema', company.scheam);
          }
          this.currentStep++;

          // Call completion callback if provided
          if (onComplete) {
            onComplete();
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Company registration error:', error);
          let errorMessage = 'An error occurred while saving company';
          if (error.status === 0) {
            errorMessage =
              'Company registration was cancelled. Please try again.';
          } else if (error.error?.Error?.Message) {
            errorMessage = error.error.Error.Message;
          } else if (error.error?.Message) {
            errorMessage = error.error.Message;
          } else if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
          } else {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          }
          this.notificationService.showError(errorMessage);

          // Still call completion callback even on error to allow navigation
          // User can retry company setup later if needed
          if (onComplete) {
            console.warn(
              'Company registration failed, but proceeding with navigation'
            );
            onComplete();
          }
        },
      });
  };

  nextStep() {
    switch (this.currentStep) {
      case 1:
        // Check if form is pending (async validators still running)
        if (this.accountFormGroup.pending) {
          this.notificationService.showInfo(
            'Please wait while we validate your information...'
          );
          return;
        }

        if (this.accountFormGroup.valid) {
          this.userEmail = this.accountFormGroup.value.email;
          this.currentStep++;
          this.cdr.detectChanges();
          requestAnimationFrame(() => {
            this.cdr.detectChanges();
            if (this.companyFormGroup) {
              this.companyFormGroup.updateValueAndValidity({
                emitEvent: false,
              });
            }
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 50);
          });
        } else {
          this.accountFormGroup.markAllAsTouched();

          // Provide specific error messages
          if (this.accountFormGroup.get('email')?.hasError('emailExists')) {
            this.notificationService.showError(
              'This email is already registered. Please use a different email.'
            );
          } else if (
            this.accountFormGroup
              .get('companyName')
              ?.hasError('companyNameExists')
          ) {
            this.notificationService.showError(
              'This company name already exists. Please use a different company name.'
            );
          } else {
            this.notificationService.showError(
              'Please fill all required fields correctly'
            );
          }
        }
        break;
      case 2:
        if (this.companyFormGroup.valid) {
          this.currentStep++;
          this.cdr.detectChanges();
        } else {
          this.companyFormGroup.markAllAsTouched();
          this.notificationService.showError(
            'Please fill all required fields * marked on them'
          );
        }
        break;
      default:
        break;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      // Trigger change detection after step change
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 50);
      });
    }
  }

  async onSubmit() {
    // Check if any form group is pending (async validators still running)
    if (
      this.accountFormGroup.pending ||
      this.companyFormGroup.pending ||
      this.packageFormGroup.pending ||
      this.reviewFormGroup.pending
    ) {
      this.notificationService.showInfo(
        'Please wait while we validate your information...'
      );
      return;
    }

    if (
      this.accountFormGroup.valid &&
      this.companyFormGroup.valid &&
      this.packageFormGroup.valid &&
      this.reviewFormGroup.valid
    ) {
      // determine tenant schema
      const tenantSchema = this.decryptedData
        ? 'demo'
        : this.generateTenantSchema(this.accountFormGroup.value.companyName);

      // // check if groupTenant exists - check both decryptedData and sessionStorage
      // // When coming from workspace, groupTenant should be in sessionStorage
      // const groupTenant =
      //   this.decryptedData?.groupTenant ||
      //   sessionStorage.getItem('tenantSchema');

      // Prepare request body
      const payload: any = {
        firstName: this.accountFormGroup.value.firstName,
        lastName: this.accountFormGroup.value.lastName,
        tenantSchema: tenantSchema,
        email: this.accountFormGroup.value.email,
        password: this.accountFormGroup.value.password,
        confirmPassword: this.accountFormGroup.value.confirmPassword,
      };

      // if groupTenant available, add it and call groupTenant API
      let apiUrl = 'api/Account/Register';
      // if (groupTenant) {
      //   payload.groupTenant = groupTenant;
      //   apiUrl = 'api/Account/RegistrationUnderGroupTenant';
      // }

      // Prevent multiple submissions
      if (this.isSubmitting) {
        console.warn(
          'Registration already in progress, ignoring duplicate submission'
        );
        return;
      }

      this.isSubmitting = true;
      console.log('Starting registration request:', {
        apiUrl,
        payload: { ...payload, password: '***' },
      });

      // For critical operations like registration, don't use takeUntil
      // This ensures the request completes even if component is destroyed
      this.registrationSubscription = this.accountService
        .registerUser(apiUrl, payload)
        .pipe(
          finalize(() => {
            console.log(
              'Registration request finalized (completed or cancelled)'
            );
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response: any) => {
            console.log('Registration successful:', response);
            try {
              const companyName = this.accountFormGroup.value.companyName;
              this.isCompleted = true;
              this.notificationService.showSuccess('Registration successful');

              // Send company data and wait for it to complete before navigating
              this.sendCompaniesData(
                this.companyFormGroup.value,
                companyName,
                () => {
                  // Navigation callback - only navigate after company registration completes
                  console.log(
                    'Company registration completed, navigating to login'
                  );
                  setTimeout(() => {
                    this.router.navigate(['/login']);
                  }, 500);
                }
              );
            } catch (error) {
              console.error('Error in registration success handler:', error);
              this.notificationService.showError(
                'Registration completed but there was an error processing the response'
              );
            }
          },
          error: (error: any) => {
            console.error('Registration error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              name: error.name,
              error: error.error,
              url: error.url,
              timestamp: new Date().toISOString(),
            });

            let errorMessage = 'Registration failed';

            // Check for timeout errors
            if (error.message && error.message.includes('timeout')) {
              errorMessage =
                'Registration request timed out. The server may be processing your request. Please wait a moment and check if registration was successful, or try again.';
              console.error('Registration timeout detected');
            } else if (error.status === 0) {
              // Request was cancelled or network error
              if (error.error) {
                errorMessage =
                  'Network error. Please check your connection and try again.';
              } else {
                errorMessage =
                  'Request was cancelled. This may happen if you navigated away. Please try again.';
              }
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }
            this.notificationService.showError(errorMessage);
          },
        });
    } else {
      // Show message if any required field is missing
      this.accountFormGroup.markAllAsTouched();
      this.companyFormGroup.markAllAsTouched();
      this.packageFormGroup.markAllAsTouched();
      this.reviewFormGroup.markAllAsTouched();

      this.notificationService.showError(
        'Please fill all required fields before proceeding'
      );
    }
  }

  // Async validator for email
  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        return of(null);
      }

      // Skip validation if email format is invalid (synchronous validator will handle it)
      if (control.hasError('email')) {
        return of(null);
      }

      const email = control.value.trim().toLowerCase();
      const headers = new HttpHeaders({
        'X-Tenant-Schema': 'dbo',
      });

      const url = `${this.accountService.environment.urlAddress}/api/Employee/GetAllRegisteredEmails`;
      return this.http.get<any[]>(url, { headers }).pipe(
        map((emails: any[]) => {
          const exists = emails.some((registeredEmail: any) => {
            const emailValue =
              typeof registeredEmail === 'string'
                ? registeredEmail
                : registeredEmail.email ||
                registeredEmail.emailId ||
                registeredEmail;
            return emailValue && emailValue.trim().toLowerCase() === email;
          });
          return exists ? { emailExists: true } : null;
        }),
        catchError(() => {
          // If API call fails, don't block the user
          return of(null);
        })
      );
    };
  }

  // Async validator for company name
  companyNameExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        return of(null);
      }

      const companyName = control.value.trim();
      const headers = new HttpHeaders({
        'X-Tenant-Schema': 'dbo',
      });

      const url = `${this.accountService.environment.urlAddress
        }/api/Company/CheckCompanyNameExists?companyName=${encodeURIComponent(
          companyName
        )}`;
      return this.http.get<{ exists: boolean }>(url, { headers }).pipe(
        map((response: { exists: boolean }) => {
          return response.exists ? { companyNameExists: true } : null;
        }),
        catchError(() => {
          // If API call fails, don't block the user
          return of(null);
        })
      );
    };
  }
}
