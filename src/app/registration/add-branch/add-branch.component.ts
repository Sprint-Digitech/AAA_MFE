import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormConfig,
  FormColumn,
  AddUpdateFormComponent,
} from '@fovestta2/web-angular';
import { AccountService } from '../../shared/services/account.service';
import { NotificationService } from '../../shared/services/notification.service';

interface CompanyBranchDto {
  id?: string;
  addressId?: string;
  companyBranchName: string;
  //  currencyName: string;
  status: any;
  companyId?: string;
  currencyId?: string;
}

@Component({
  selector: 'app-add-branch',
  imports: [AddUpdateFormComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './add-branch.component.html',
  styleUrls: ['./add-branch.component.scss'],
})
export class AddBranchComponent implements OnInit {
  public message: any;
  public companyId: any;
  companyBranchId: any;
  addBranchForm = new FormGroup({
    branchName: new FormControl('', [Validators.required]),
    currencyId: new FormControl('', [Validators.required]),
    status: new FormControl('1'),
  });
  currencies: any;
  id: any;

  get branchName(): FormControl {
    return this.addBranchForm.get('branchName') as FormControl;
  }
  get currencyId(): FormControl {
    return this.addBranchForm.get('currencyId') as FormControl;
  }
  get status(): FormControl {
    return this.addBranchForm.get('status') as FormControl;
  }
  showCurrencyError: boolean = false;
  addBranchFormConfig!: FormConfig;
  addBranchFormLoaded: boolean = false;
  isEditMode: boolean = false;
  branchData_loaded: any = null;
  constructor(
    private branchData: AccountService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private activeRoute: ActivatedRoute,
  ) {}
  ngOnInit(): void {
    // this.getCurrency();
    // this.getBranchDetails();
    this.route.params.subscribe((params) => {
      this.companyId = params['companyId'];
      this.companyBranchId = params['id'];
      this.isEditMode = !!this.companyBranchId; // Set edit mode if id exists
    });

    this.initializeForm();
    this.getCurrency();
  }
  initializeForm(): void {
    this.addBranchForm = new FormGroup({
      branchName: new FormControl('', [Validators.required]),
      currencyId: new FormControl('', [Validators.required]),
      status: new FormControl('1', [Validators.required]),
    });
  }
  initializeFormConfig(): void {
    let defaultBranchName = '';
    let defaultCurrencyId = '';
    let defaultStatus = '1';

    if (this.isEditMode && this.branchData_loaded) {
      defaultBranchName = this.branchData_loaded.companyBranchName || '';
      defaultCurrencyId = this.branchData_loaded.currencyId || '';
      defaultStatus = this.branchData_loaded.status?.toString() || '1';
    } else {
      if (this.currencies.length === 1) {
        defaultCurrencyId = this.currencies[0].id;
      }
      defaultStatus = '1';
    }
    const fields: FormColumn[] = [
      {
        name: 'branchName',
        label: 'Branch Name',
        type: 'text',
        maxLength: 50,
        colSpan: 1,
        value: defaultBranchName,
        validations: [
          { type: 'required', message: 'Branch Name is required' },
          { type: 'maxLength', value: 50, message: 'Max 50 characters' },
          {
            type: 'pattern',
            value: '^[a-zA-Z\\s]*$',
            message: 'Branch Name should contain alphabets only',
          },
        ],
      },
      {
        name: 'currencyId',
        label: 'Currency',
        type: 'select',
        colSpan: 1,
        value: defaultCurrencyId,
        options: this.currencies.map((currency: any) => ({
          label: currency.currencyName,
          value: currency.id,
        })),
        validations: [{ type: 'required', message: 'Currency is required' }],
      },
    ];

    // Only show status field in edit mode
    if (this.isEditMode) {
      fields.push({
        name: 'status',
        label: 'Status',
        type: 'radio',
        layout: 'horizontal',
        colSpan: 1,
        value: defaultStatus,
        options: [
          { label: 'Active', value: '1' },
          { label: 'Inactive', value: '0' },
        ],
        validations: [{ type: 'required', message: 'Status is required' }],
      });
    }

    this.addBranchFormConfig = {
      formTitle: this.isEditMode ? 'Update Branch' : 'Add Branch',
      maxColsPerRow: 5,
      sections: [{ fields }],
      submitLabel: this.isEditMode ? 'Update' : 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data: any) => this.handleFormSubmit(data),
      onCancel: () => this.goBack(),
    };
    this.addBranchForm.patchValue({
      branchName: defaultBranchName,
      currencyId: defaultCurrencyId,
      status: defaultStatus,
    });
    this.addBranchFormLoaded = true;
  }

  getCurrency() {
    this.branchData.get('api/Currency/Currency').subscribe({
      next: (data: any[]) => {
        this.currencies = data.filter((currency) => currency.status === 1);
        this.showCurrencyError = this.currencies.length === 0;
        if (this.isEditMode) {
          this.getBranchData();
        } else {
          this.initializeFormConfig();
        }
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showError(errorMessage);
      },
    });
  }

  onCurrencyChange() {
    if (this.currencies.length === 0) {
      this.showCurrencyError = true;
    } else {
      this.showCurrencyError = false;
    }
  }
  getBranchData(): void {
    if (!this.companyBranchId) {
      console.error('Error: companyBranchId is undefined!');
      return;
    }

    this.branchData
      .get(
        `api/company-branch/GetCompanyBranch?branchId=${this.companyBranchId}`,
      )
      .subscribe({
        next: (data: any) => {
          // Patch the form with existing data
          this.branchData_loaded = data[0];
          this.initializeFormConfig();
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage =
            error.error instanceof ErrorEvent
              ? `Error: ${error.error.message}`
              : `Error Code: ${error.status}\nMessage: ${error.message}`;
          this.notificationService.showError(errorMessage);
        },
      });
  }

  handleFormSubmit(formValue: any): void {
    if (this.isEditMode) {
      this.sendUpdatedBranchData(formValue);
    } else {
      this.sendBranchData(formValue);
    }
  }

  sendBranchData = (formValue: any) => {
    const branch: CompanyBranchDto = {
      companyBranchName: formValue.branchName,
      currencyId: formValue.currencyId,
      status: 1,
      companyId: this.companyId,
    };
    this.branchData
      .post(`api/company-branch/CreateCompanyBranch`, branch)
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Saved Successfully');
          this.addBranchForm.reset();
          setTimeout(() => {
            this.goBack();
          }, 1500);
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'An error occurred';
          if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
          } else {
            // Server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          }

          this.notificationService.showError(errorMessage);
        },
      });
  };
  sendUpdatedBranchData = (formValue: any) => {
    const statusValue = formValue.status;
    let finalStatus: number;
    if (statusValue === '0' || statusValue === 0) {
      finalStatus = 0;
    } else if (statusValue === '1' || statusValue === 1) {
      finalStatus = 1;
    } else {
      finalStatus = Number(statusValue) || 0;
    }

    console.log('Final Status To Send:', finalStatus);
    // const formValues = { ...formValue };
    const updateBranchForm: CompanyBranchDto = {
      companyBranchName: formValue.branchName,
      currencyId: formValue.currencyId,
      status: finalStatus,
      companyId: this.companyId,
      id: this.companyBranchId,
    };
    this.branchData
      .update(`api/company-branch/UpdateCompanyBranch`, updateBranchForm)
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Updated Successfully');
          setTimeout(() => {
            this.router.navigate([`company/details/${this.companyId}`]);
          }, 1500);
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage =
            error.error instanceof ErrorEvent
              ? `Error: ${error.error.message}`
              : `Error Code: ${error.status}\nMessage: ${error.message}`;
          this.notificationService.showError(errorMessage);
        },
      });
  };

  goBack(): void {
    this.location.back();
  }
}
// public getBranchDetails = () => {
//   this.route.paramMap.subscribe((params) => {
//     this.companyId = params.get('companyId');
//   });

//   this.reposotory
//     .getBranch(
//       `api/CompanyBranch/CompanyBranchListByCompanyGuid?CompanyId=${this.companyId}`
//     )
//     .subscribe({
//       next: (branchData) => {
//       },
//       error: (error: HttpErrorResponse) => {
//         let errorMessage = 'An error occurred';
//         if (error.error instanceof ErrorEvent) {
//           // Client-side error
//           errorMessage = `Error: ${error.error.message}`;
//         } else {
//           // Server-side error
//           errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
//         }

//         this.notificationService.showError(errorMessage);
//       },
//     });
// };
//
//prev before redirection not working
// if (sent === null) {
//   this.openSnackBar('Saved Successfully', 'Okay', 'green-snackbar');
//   this.addBranchForm.reset();
//   setTimeout(() => {
//     this.router.navigate([`company/details/${this.companyId}`]);
//   }, 1500);

// }

//   this.notificationService.showSuccess('Saved Successfully');
//   this.addBranchForm.reset();
//   this.goBack();
// },
// const formValues = { ...addFormBranchValue };
// this.route.params.subscribe((params) => {
//   this.companyId = params['companyId'];
// })
