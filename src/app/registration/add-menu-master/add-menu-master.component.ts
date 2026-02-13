import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { NotificationService } from '../../shared/services/notification.service';
import { AccountService } from '../../shared/services/account.service';

@Component({
  selector: 'app-add-menu-master',
  imports: [CommonModule, AddUpdateFormComponent, FormsModule],
  templateUrl: './add-menu-master.component.html',
  styleUrls: ['./add-menu-master.component.scss'],
})
export class AddMenuMasterComponent {
  menuList: any;
  // url for showing parent path or other path
  selectedBaseURL: string = 'http://localhost:4200/sprintdigitech/#/';
  selectedOption: any = null;
  parentMenuList: any[] = [];
  // create form for menu master
  addmenuMasterForm = new FormGroup({
    menuName: new FormControl('', Validators.required),
    menuDisplayName: new FormControl('', Validators.required),
    menuHeader: new FormControl(''),
    menuType: new FormControl('', Validators.required),
    remarks: new FormControl('', Validators.required),
    status: new FormControl(1),
    MenuIcon: new FormControl(''),
  });

  get menuName(): FormControl {
    return this.addmenuMasterForm.get('menuName') as FormControl;
  }

  get menuDisplayName(): FormControl {
    return this.addmenuMasterForm.get('menuDisplayName') as FormControl;
  }
  get menuHeader(): FormControl {
    return this.addmenuMasterForm.get('menuHeader') as FormControl;
  }
  get menuType(): FormControl {
    return this.addmenuMasterForm.get('menuType') as FormControl;
  }
  get remarks(): FormControl {
    return this.addmenuMasterForm.get('remarks') as FormControl;
  }
  get status(): FormControl {
    return this.addmenuMasterForm.get('status') as FormControl;
  }
  menuID: any;
  addmenuMasterFormConfig!: FormConfig;
  addmenuMasterFormLoaded: boolean = false;
  isEditMode: boolean = false;

  // Using for this contructor for add and inject dependancy
  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private accountService: AccountService,
  ) {}
  // this lifecycle use for loanding get api
  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.menuID = params['menuID'] || null;
      this.isEditMode = !!this.menuID;
      this.getMenuMaster();
      this.initializeFormConfig();
      this.addmenuMasterFormLoaded = true;
    });

    this.addmenuMasterForm
      .get('menuName')
      ?.valueChanges.subscribe((value: any) => {
        this.updatePathField(value);
      });
  }

  // created this function for dropodwn menuname
  menuOptions = [
    { value: 'Home', label: 'Home', isBold: true, parent: '' },
    { value: 'Master', label: 'Master', isBold: true, parent: '' },
    { value: 'currency', label: 'currency', parent: 'Master' },
    { value: 'locationType', label: 'locationType', parent: 'Master' },
    { value: 'locationName', label: 'locationName', parent: 'Master' },
    { value: 'department', label: 'department', parent: 'Master' },
    { value: 'Designation', label: 'Designation', parent: 'Master' },
    { value: 'nomineeType', label: 'nomineeType', parent: 'Master' },
    { value: 'payHeadGroup', label: 'payHeadGroup', parent: 'Master' },
    { value: 'payHead', label: 'payHead', parent: 'Master' },
    { value: 'payHeadTemplate', label: 'payHeadTemplate', parent: 'Master' },
    {
      value: 'minimumWagesCategory',
      label: 'minimumWagesCategory',
      parent: 'Master',
    },
    { value: 'minimumWages', label: 'minimumWages', parent: 'Master' },

    { value: 'Employee', label: 'Employee', isBold: true, parent: '' },
    { value: 'List', label: 'List', parent: 'employee' },
    { value: 'CTC', label: 'CTC', parent: 'employee' },
    { value: 'Bonus', label: 'Bonus', isBold: true, parent: '' },
    {
      value: 'BonusConfiguration',
      label: 'BonusConfiguration',
      parent: 'bonus',
    },
    { value: 'BonusRules', label: 'BonusRules', parent: 'bonus' },
    {
      value: 'EmployeeEligibility',
      label: 'EmployeeEligibility',
      parent: 'bonus',
    },
    {
      value: 'management-bonus-report',
      label: 'management-bonus-report',
      parent: 'bonus',
    },
    {
      value: 'statutory-bonus-report',
      label: 'statutory-bonus-report',
      parent: 'bonus',
    },
    { value: 'bonus-freeze', label: 'bonus-freeze', parent: 'bonus' },
    {
      value: 'Attendance & Leave',
      label: 'Attendance & Leave',
      isBold: true,
      parent: '',
    },
    {
      value: 'SourceMaster',
      label: 'SourceMaster',
      parent: 'Attendance & Leave',
    },
    { value: 'View', label: 'View', parent: 'Attendance & Leave' },
    { value: 'Upload', label: 'Upload', parent: 'Attendance & Leave' },
    {
      value: 'Check in Check Out',
      label: 'Check in Check Out',
      parent: 'Attendance & Leave',
    },
    {
      value: 'Employee Movement',
      label: 'Employee Movement',
      parent: 'Attendance & Leave',
    },
    { value: 'Timesheet', label: 'Timesheet', parent: 'Attendance & Leave' },
    { value: 'Leave', label: 'Leave', parent: 'Attendance & Leave' },
    { value: 'Salary', label: 'Salary', isBold: true, parent: '' },
    { value: 'SalaryDefination', label: 'SalaryDefination', parent: 'salary' },
    { value: 'SalarySlip', label: 'SalarySlip', parent: 'salary' },
    { value: 'SalaryReport', label: 'SalaryReport', parent: 'salary' },
    { value: 'SalaryFreeze', label: 'SalaryFreeze', parent: 'salary' },
    { value: 'Pay', label: 'Pay', isBold: true, parent: '' },
    { value: 'Monthly', label: 'Monthly', parent: 'perquisites' },
    { value: 'Annual', label: 'Annual', parent: 'perquisites' },
    { value: 'Perquisite', label: 'Perquisite', parent: 'perquisites' },
    { value: 'F&F', label: 'F&F', parent: 'perquisites' },
    { value: 'Loan', label: 'Loan', isBold: true, parent: '' },
    { value: 'LoanList', label: 'LoanList', parent: 'loan' },
    { value: 'LoanPayment', label: 'LoanPayment', parent: 'loan' },
    // { value: 'Disbursement', label: 'Disbursement', parent: 'loan' },
    { value: 'Repayment', label: 'Repayment', parent: 'loan' },
    { value: 'Income Tax', label: 'Income Tax', isBold: true, parent: '' },
    {
      value: 'user Roles And Permissions',
      label: 'user Roles And Permissions',
      isBold: true,
      parent: '',
    },
    {
      value: 'RoleMaster',
      label: 'RoleMaster',
      parent: 'userRolesAndPermissions',
    },
    {
      value: 'MenuMaster',
      label: 'MenuMaster',
      parent: 'userRolesAndPermissions',
    },
    { value: 'MenuRole', label: 'MenuRole', parent: 'userRolesAndPermissions' },
    { value: 'Reports', label: 'Reports', isBold: true, parent: '' },
    { value: 'Basic', label: 'Basic', parent: 'Reports' },
    { value: 'Contact', label: 'Contact', parent: 'Reports' },
    { value: 'Family', label: 'Family', parent: 'Reports' },
    { value: 'Education', label: 'Education', parent: 'Reports' },
    { value: 'Nominee', label: 'Nominee', parent: 'Reports' },
    // { value: 'Income Tax', label: 'Income Tax', parent: 'Reports' },
    { value: 'Settings', label: 'Settings', isBold: true, parent: '' },
    { value: 'companygroup', label: 'companygroup', parent: 'Settings' },
    { value: 'company', label: 'company', parent: 'Settings' },
    { value: 'FinancialYear', label: 'FinancialYear', parent: 'Settings' },
    { value: 'Tracing', label: 'Tracing', parent: 'Settings' },
    { value: 'CustomFormula', label: 'CustomFormula', parent: 'Settings' },
    {
      value: 'Reimbursement',
      label: 'Reimbursement',
      isBold: true,
      parent: '',
    },
    { value: 'Type', label: 'Type', parent: 'Reimbursement' },
    { value: 'Limit', label: 'Limit', parent: 'Reimbursement' },
    { value: 'Request', label: 'Request', parent: 'reimbursement' },
    {
      value: 'ApprovalRequest',
      label: 'ApprovalRequest',
      parent: 'reimbursement',
    },
    { value: 'MISReport', label: 'MISReport', parent: 'Reimbursement' },
    {
      value: 'FinancialDashboard',
      label: 'FinancialDashboard',
      parent: 'reimbursement',
    },
  ];

  onMenuChange(option: any): void {
    this.selectedOption = option;
  }

  // Update Path based on dropdown selection
  updatePathField(selectedName: any): void {
    if (selectedName) {
      let path = '';
      let parent = '';
      // switch (selectedName.toLowerCase()) {
      switch (selectedName) {
        case 'Home':
          path = '/authentication/welcome-user';
          parent = '';
          break;
        case 'Master':
          path = '/master';
          parent = '';
          break;
        case 'currency':
          path = 'master/currency';
          parent = 'Master';
          break;
        case 'locationType':
          path = '/master/locationType';
          parent = 'Master';
          break;
        case 'locationName':
          path = '/master/location';
          parent = 'Master';
          break;
        case 'department':
          path = 'master/department';
          parent = 'Master';
          break;
        case 'Designation':
          path = 'master/designation';
          parent = 'Master';
          break;
        case 'nomineeType':
          path = 'master/nomineeType';
          parent = 'Master';
          break;
        case 'payHead':
          path = 'payRoll/payHead';
          parent = 'Master';
          break;
        case 'payHeadGroup':
          path = '/payRoll/payHeadGroup';
          parent = 'Master';
          break;
        case 'payHeadTemplate':
          path = '/payRoll/payHeadTemplate';
          parent = 'Master';
          break;
        case 'minimumWages':
          path = '/master/minimumWages';
          parent = 'Master';
          break;
        case 'minimumWagesCategory':
          path = '/master/minimumWagesCategory';
          parent = 'Master';
          break;
        case 'Type':
          path = 'reimbursement/reimbursement-list';
          parent = 'reimbursement';
          break;
        case 'Limit':
          path = '/reimbursement/ReimbursementLimitComponen';
          parent = 'reimbursement';
          break;
        case 'Reimbursement':
          path = '/reimbursement';
          parent = '';
          break;

        case 'RoleMaster':
          path = '/userRolesAndPermissions/roles';
          parent = 'userRolesAndPermissions';
          break;
        case 'MenuRole':
          path = '/MenuMaster/MenuRoleMapping';
          parent = 'userRolesAndPermissions';
          break;
        case 'MenuMaster':
          path = '/MenuMaster/MenuMasterList';
          parent = 'userRolesAndPermissions';
          break;
        case 'user Roles And Permissions':
          path = '/userRolesAndPermissions';
          parent = '';
          break;
        case 'FinancialDashboard':
          path = '/reimbursement/finance-dashboard';
          parent = 'reimbursement';
          break;
        case 'loan':
          path = '/loan';
          parent = 'Master';
          break;
        case 'Loan':
          path = '/loan';
          parent = '';
          break;
        case 'LoanList':
          path = '/loan/loan';
          parent = 'loan';
          break;
        case 'LoanPayment':
          path = '/loan/employeeLoanPayment';
          parent = 'loan';
          break;
        case 'Disbursement':
          path = '/loan/employeeLoanPayment';
          parent = 'loan';
          break;
        case 'Request':
          path = 'reimbursement/reimbursement-request';
          parent = 'Master';
          break;
        case 'Perquisite':
          path = 'perquisites/perquisiteHead';
          parent = 'Master';
          break;
        case 'Repayment':
          path = '/loan/loanRepaymentList';
          parent = 'loan';
          break;
        case 'Pay':
          path = '/perquisites';
          parent = '';
          break;
        case 'ApprovalRequest':
          path = '/reimbursement/ApproveReimbusementRequest';
          parent = 'reimbursement';
          break;
        // case 'Bonus':
        //   path = 'bonus/bonus-list';
        //   parent = 'Master';
        //   break;
        case 'List':
          path = '/employee/employeesList';
          parent = 'employee';
          break;
        case 'CTC':
          path = '/employee/employeeCTC';
          parent = 'employee';
          break;
        case 'Attendance & Leave':
          path = '/attendance';
          parent = '';
          break;
        case 'SourceMaster':
          path = '/attendance/source-master';
          parent = 'Attendance & Leave';
          break;
        case 'Monthly':
          path = '/perquisites/perquisiteHead';
          parent = 'perquisites';
          break;
        case 'Annual':
          path = '/perquisites/employeePerquisite';
          parent = 'perquisites';
          break;
        case 'Perquisite':
          path = '/reimbursement/reimbursementHead';
          parent = 'perquisites';
          break;
        case 'F&F':
          path = 'reimbursement/reimbursementHead';
          parent = 'perquisites';
          break;
        case 'View':
          path = 'employee/employeeAttendance';
          parent = 'Attendance & Leave';
          break;
        case 'Upload':
          path = 'employee/addEmployeeAttendance';
          parent = 'Attendance & Leave';
          break;
        case 'Check in Check Out':
          path = 'attendance/checkinoutlist';
          parent = 'Attendance & Leave';
          break;
        case 'Employee Movement':
          path = '/attendance/employee-movement';
          parent = 'Attendance & Leave';
          break;
        case 'Salary':
          path = '/salary';
          parent = '';
          break;
        case 'SalaryDefination':
          path = '/salary/salaryy';
          parent = 'salary';
          break;
        case 'SalarySlip':
          path = '/salary/salarySlip';
          parent = 'salary';
          break;
        case 'SalaryReport':
          path = '/salary/reportsalary';
          parent = 'salary';
          break;
        case 'SalaryFreeze':
          path = '/salary/salaryFreezeList';
          parent = 'salary';
          break;
        case 'Timesheet':
          parent = 'Master';
          path = '/attendance/checkinoutlist';
          parent = 'Attendance & Leave';
          break;
        case 'Leave':
          path = 'attendance/leave-master-list';
          parent = 'Attendance & Leave';
          break;
        case 'Income Tax':
          path = '/investment';
          parent = '';
          break;
        case 'MISReport':
          path = '/reimbursement/mis-report';
          parent = 'Reimbursement';
          break;
        case 'Declaration':
          path = '/investment/investment';
          parent = '/investment';
          break;
        case 'Proof Submission':
          path = '/investment/investmentOption';
          parent = '/investment';
          break;
        case 'Settings':
          path = '/company';
          parent = '';
          break;
        case 'Employee':
          path = '/employee';
          parent = '';
          break;
        case 'Reports':
          path = '/Reports';
          parent = '';
          break;
        case 'Basic':
          path = '/payRoll/salaryreport';
          parent = 'Reports';
          break;
        case 'Bonus':
          path = '/bonus';
          parent = '';
          break;
        case 'BonusConfiguration':
          path = '/bonus/bonus-list';
          parent = 'bonus';
          break;
        case 'BonusRules':
          path = '/bonus/bonus-rate-list';
          parent = 'bonus';
          break;
        case 'EmployeeEligibility':
          path = '/bonus/employee-eligibility-list';
          parent = 'bonus';
          break;
        case 'bonus-freeze':
          path = '/bonus/bonus-freeze-list';
          parent = 'bonus';
          break;
        case 'statutory-bonus-report':
          path = '/bonus/statutory-bonus-report';
          parent = 'bonus';
          break;
        case 'management-bonus-report':
          path = '/bonus/management-bonus-report';
          parent = 'bonus';
          break;
        case 'Contact':
          path = '/employee/contactListReport';
          parent = 'Reports';
          break;
        case 'Family':
          path = '/employee/familyDetailReport';
          parent = 'Reports';
          break;
        case 'Education':
          path = '/employee/educationDetailreport';
          parent = 'Reports';
          break;
        case 'Nominee':
          path = '/employee/nomineeDetailReport';
          parent = 'Reports';
          break;
        case 'companygroup':
          path = '/company/companyGroup';
          parent = 'Settings';
          break;
        case 'company':
          path = '/company/list';
          parent = 'Settings';
          break;
        case 'FinancialYear':
          path = '/utility/utility';
          parent = 'Settings';
          break;
        case 'UserRoles':
          path = '/userRolesAndPermissions/userRoleMapping';
          parent = 'Settings';
          break;
        case 'CustomFormula':
          path = '/payRoll/customformula';
          parent = 'Settings';
          break;
        case 'User Permissions':
          path = '/MenuMaster/MenuRoleMapping';
          parent = 'Settings';
          break;
        case 'Tracing':
          path = '/company/tracing-view';
          parent = 'Settings';
          break;
        default:
          path = '';
          parent = '';
      }
      this.addmenuMasterForm.patchValue({
        menuType: `${path}`,
        menuHeader: `${parent}`,
      });
    }
  }
  initializeFormConfig(initialValues?: any) {
    const parentMenuOptions =
      this.parentMenuList?.map((menu) => ({
        label: menu.menuDisplayName || menu.menuName,
        value: menu.menuID,
      })) || [];
    console.log('Parent Menu Options:', parentMenuOptions);
    this.addmenuMasterFormConfig = {
      formTitle: this.isEditMode ? 'Update Menu Master ' : 'Add Menu Master',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'menuName',
              label: 'Name',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              value: initialValues?.menuName || '',
              validations: [
                { type: 'required', message: 'Menu Name is required' },
                { type: 'maxLength', value: 50, message: 'Max 50 characters' },
                {
                  type: 'pattern',
                  value: '^[a-zA-Z\\s]*$',
                  message: 'Menu Name should contain alphabets only',
                },
              ],
            },
            {
              name: 'menuDisplayName',
              label: 'Display Name',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              value: initialValues?.menuDisplayName || '',
              validations: [
                { type: 'required', message: 'Display Name is required' },
                { type: 'maxLength', value: 50, message: 'Max 50 characters' },
                {
                  type: 'pattern',
                  value: '^[a-zA-Z\\s]*$',
                  message: 'Display Name should contain alphabets only',
                },
              ],
            },
            {
              name: 'menuHeader',
              label: 'Parent Menu',
              type: 'select',
              colSpan: 1,
              value: initialValues?.menuHeader || '',
              options: [
                { label: 'Choose...', value: '' },
                ...parentMenuOptions,
              ],
              validations: [
                { type: 'required', message: 'Parent Menu is required' },
              ],
            },
            {
              name: 'menuType',
              label: 'Path',
              type: 'text',
              colSpan: 1,
              value: initialValues?.menuType || '',
              validations: [{ type: 'required', message: 'Path is required' }],
            },
            {
              name: 'remarks',
              label: 'Description ',
              type: 'text',
              colSpan: 1,
              value: initialValues?.remarks || '',
              validations: [
                { type: 'required', message: 'Remarks is required' },
              ],
            },
            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              value: '1',
              options: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
              ],
            },
            {
              name: 'MenuIcon',
              label: 'Upload Icon',
              type: 'file',
              accept: 'image/*',
              colSpan: 5, // Full width
              hint: 'Upload menu icon (JPG, PNG)',
            },
          ],
        },
      ],
      submitLabel: this.isEditMode ? 'Update' : 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data: any) => {
        this.sendData1(data);
      },
      onCancel: () => this.goBack(),
    };
  }

  getData() {
    this.addmenuMasterFormLoaded = false;
    if (!this.menuID) return;

    this.accountService
      .get(`api/Roles/GetMenuMaster?menuId=${this.menuID}`)
      .subscribe((response: any) => {
        // --- FIX: Handle Array Response ---
        let data;
        if (Array.isArray(response) && response.length > 0) {
          data = response[0]; // Take the first object from the array
        } else {
          data = response; // Fallback if it is not an array
        }

        // Safely map the data
        const formData = {
          menuName: data?.menuName || '',
          menuDisplayName: data?.menuDisplayName || '',
          menuHeader: data?.menuParent?.menuID || '',
          menuType: data?.menuPath || '',
          remarks: data?.remarks || '',
          status: data?.status || 1,
        };

        this.addmenuMasterForm.patchValue(formData);
        // Reinitialize form config with loaded values
        this.initializeFormConfig(formData);

        this.addmenuMasterFormLoaded = true;
      });
  }

  generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  sendData1(formValues: any) {
    if (
      !formValues.menuName ||
      !formValues.menuDisplayName ||
      !formValues.menuType ||
      !formValues.remarks
    ) {
      this.notificationService.showError('Please fill all required fields.');
      return;
    }
    const menuName = formValues.menuName.trim();
    const menuDisplayName = formValues.menuDisplayName.trim();
    const menuType = formValues.menuType.trim();
    const remarks = formValues.remarks.trim();

    if (!menuName || !menuDisplayName || !menuType || !remarks) {
      this.notificationService.showError(
        'Fields cannot be empty or contain only spaces.',
      );
      return;
    }

    const menuParentId = formValues.menuHeader || null;

    const addMenuMasterForm: any = {
      menuID: this.menuID || this.generateUniqueId(),
      menuName: String(formValues.menuName || '').trim(),
      menuDisplayName: String(formValues.menuDisplayName || '').trim(),
      menuParentId: menuParentId,
      menuPath: String(formValues.menuType || '').trim(),
      remarks: String(formValues.remarks || '').trim(),
      status: formValues.status,
    };

    if (this.menuID && this.isEditMode) {
      this.accountService
        .update('api/Roles/UpdateMenuMaster', addMenuMasterForm)
        .subscribe(
          (response) => {
            this.notificationService.showSuccess(
              'Menu Master Updated Successfully',
            );
            // Add a small delay to ensure backend has processed the update
            setTimeout(() => {
              // Reload menu data to reflect changes in sidebar immediately
              console.log('Reloading menu data after update...');
              this.accountService.reloadMenuData().subscribe({
                next: (menus) => {
                  console.log(
                    'Menu data refreshed successfully. Menus count:',
                    menus?.length || 0,
                  );
                },
                error: (error) => {
                  console.error('Error refreshing menu data:', error);
                },
              });
            }, 500); // 500ms delay to allow backend to process
            this.router.navigate(['MenuMaster/MenuMasterList']);
            this.addmenuMasterForm.reset();
          },
          (error) => {
            this.notificationService.showError(
              'Failed to update Menu Master. Please try again.',
            );
            console.error('Error while updating menu master:', error);
          },
        );
    } else {
      // Call the service to post data
      this.accountService
        .post('api/Roles/CreateMenuMaster', addMenuMasterForm)
        .subscribe(
          (response) => {
            console.log('Response:', response);
            this.notificationService.showSuccess(
              'Menu Master Saved Successfully',
            );
            // Add a small delay to ensure backend has processed the creation
            setTimeout(() => {
              // Reload menu data to reflect changes in sidebar immediately
              console.log('Reloading menu data after creation...');
              this.accountService.reloadMenuData().subscribe({
                next: (menus) => {
                  console.log(
                    'Menu data refreshed successfully. Menus count:',
                    menus?.length || 0,
                  );
                },
                error: (error) => {
                  console.error('Error refreshing menu data:', error);
                },
              });
            }, 500); // 500ms delay to allow backend to process
            this.addmenuMasterForm.reset(); // Reset the form
            this.router.navigate(['MenuMaster/MenuMasterList']);
          },
          (error) => {
            this.notificationService.showError(
              'Failed to save Menu Master. Please try again.',
            );
            console.error('Error while saving menu master:', error);
          },
        );
    }
  }

  selectedFile: File | null = null;

  handleEmpImgInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0]; // Store the selected file
    }
  }

  getMenuMaster() {
    this.accountService
      .get('api/Roles/GetMenuMaster')
      .subscribe((data: any) => {
        this.menuList = data;
        this.parentMenuList = this.menuList.filter(
          (menu: any) => menu.menuParentId === null,
        );
        console.log('Parent Menu List:', this.parentMenuList);
        if (this.isEditMode) {
          this.getData(); // Load data for edit mode
        } else {
          this.initializeFormConfig(); // Initialize for add mode
          this.addmenuMasterFormLoaded = true;
        }
      });
  }

  goBack(): void {
    this.location.back();
  }
}
