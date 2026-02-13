import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { TableNemo1Component } from 'table-nemo1';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { AccountService } from '../../shared/services/account.service';
import { NotificationService } from '../../shared/services/notification.service';

interface roleDto {
  roleID?: string;
  // name: string;
  // normalizedName: string;
  concurrencyStamp?: string;
  roleName: string;
  roleDisplayName: string;
  remarks: string;
  status: string;
}

@Component({
  selector: 'app-roles-add',
  imports: [AddUpdateFormComponent, CommonModule],
  templateUrl: './roles-add.component.html',
  styleUrls: ['./roles-add.component.scss'],
})
export class RolesAddComponent {
  addRolesFormConfig!: FormConfig;
  addRolesFormLoaded: boolean = false;
  addRolesForm = new FormGroup({
    roleName: new FormControl('', [
      Validators.required,
      TableNemo1Component.charValidator,
    ]),
    roleDisplayName: new FormControl('', [Validators.required]),
    remarks: new FormControl('', [Validators.required]),
  });
  public dataSource = new MatTableDataSource();
  get roleName(): FormControl {
    return this.addRolesForm.get('roleName') as FormControl;
  }
  get roleDisplayName(): FormControl {
    return this.addRolesForm.get('roleDisplayName') as FormControl;
  }
  get remarks(): FormControl {
    return this.addRolesForm.get('remarks') as FormControl;
  }
  isEditMode: boolean = false;
  roleID: any;
  constructor(
    private service: AccountService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.roleID = params['roleID'] || null;
      this.isEditMode = !!this.roleID;

      // Load role list first
      this.getAllRoleList();
    });
  }
  initializeFormConfig(initialValues?: any) {
    this.addRolesFormConfig = {
      formTitle: this.isEditMode ? 'Update Roles  ' : 'Add Roles',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'roleName',
              label: 'Name',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              value: initialValues?.roleName || '',
              validations: [
                { type: 'required', message: 'Role Name is required' },
                { type: 'maxLength', value: 50, message: 'Max 50 characters' },
                {
                  type: 'pattern',
                  value: '^[a-zA-Z\\s]*$',
                  message: 'Role Name should contain alphabets only',
                },
              ],
            },
            {
              name: 'roleDisplayName',
              label: 'Display Name',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              value: initialValues?.roleDisplayName || '',
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
              name: 'remarks',
              label: 'Remarks ',
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
          ],
        },
      ],
      submitLabel: this.isEditMode ? 'Update' : 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data: any) => {
        this.sendData(data);
      },
      onCancel: () => this.goBack(),
    };
  }
  getData() {
    this.addRolesFormLoaded = false;
    this.service
      .get(`api/Roles/GetRoles?roleId=${this.roleID}`)
      .subscribe((response: any) => {
        // --- FIX: Handle Array Response ---
        let data;
        if (Array.isArray(response) && response.length > 0) {
          data = response[0]; // Extract the first object from the array
        } else {
          data = response;
        }

        // Map the extracted data
        const formData = {
          roleName: data?.roleName || '',
          roleDisplayName: data?.roleDisplayName || '',
          remarks: data?.remarks || '',
          status: data?.status?.toString() || '1',
        };

        this.addRolesForm.patchValue(formData);
        this.initializeFormConfig(formData);
        this.addRolesFormLoaded = true;
      });
  }
  getAllRoleList() {
    this.service.get('api/Roles/GetRoles').subscribe((res: any) => {
      this.dataSource.data = res;
      if (this.isEditMode) {
        this.getData();
      } else {
        this.initializeFormConfig();
        this.addRolesFormLoaded = true;
      }
    });
  }

  sendData(formValues: any) {
    if (
      !formValues.roleName ||
      !formValues.roleDisplayName ||
      !formValues.remarks
    ) {
      this.notificationService.showError('Please fill all required fields.');
      return;
    }
    const roleName = formValues.roleName.trim();
    const roleDisplayName = formValues.roleDisplayName.trim();
    const remarks = formValues.remarks.trim();

    if (!roleName || !roleDisplayName || !remarks) {
      this.notificationService.showError(
        'Fields cannot be empty or contain only spaces.',
      );
      return;
    }
    const roleForm: roleDto = {
      roleID: this.roleID || undefined, // Include roleID for update
      roleName: formValues.roleName,
      roleDisplayName: formValues.roleDisplayName,
      remarks: formValues.remarks,
      status: formValues.status || '1',
    };
    if (this.roleID && this.isEditMode) {
      this.service
        .update('api/Roles/UpdateRole', { roleDto: roleForm })
        .subscribe({
          next: (res) => {
            this.notificationService.showSuccess('Role Updated Successfully');
            this.addRolesForm.reset();
            setTimeout(() => {
              this.router.navigate(['userRolesAndPermissions/roles']);
            }, 1500);
          },
          error: (error: any) => {
            console.error('Update failed:', error);
            this.notificationService.showError('Failed to update Role');
          },
        });
    } else {
      const roleName = formValues.roleName?.trim().toLowerCase() || '';
      const isDuplicate = this.dataSource.data.some(
        (role: any) => role.roleName?.trim().toLowerCase() === roleName,
      );

      if (isDuplicate) {
        this.notificationService.showError('Role already exists!');
        return;
      }

      this.service
        .post('api/Roles/CreateRole', { roleDto: roleForm })
        .subscribe({
          next: (response) => {
            this.notificationService.showSuccess('Role Saved Successfully');
            this.addRolesForm.reset();
            this.getAllRoleList(); // Refresh the list
            setTimeout(() => {
              this.router.navigate(['userRolesAndPermissions/roles']);
            }, 1500);
          },
          error: (error) => {
            console.error('Create failed:', error);
            this.notificationService.showError('Failed to save role');
          },
        });
    }
  }

  addRole1() {
    if (this.addRolesForm.valid) {
      let roleObj = {
        roleName: this.addRolesForm.value.roleName,
        roleDisplayName: this.addRolesForm.value.roleDisplayName,
        remarks: this.addRolesForm.value.remarks,
        status: '1',
      };
      this.service.post('api/Roles/CreateRole', roleObj).subscribe({
        next: () => {
          this.notificationService.showSuccess('Saved Successfully');
          this.addRolesForm.reset();
          this.router.navigate(['userRolesAndPermissions/roles']);
        },
        error: () => {
          this.notificationService.showError('Failed to save role');
        },
      });
    } else {
      this.notificationService.showError(
        'Error in form. Please check all fields.',
      );
    }
  }

  addRole() {
    if (this.addRolesForm.valid) {
      const roleName =
        this.addRolesForm.value.roleName?.trim().toLowerCase() || '';
      const isDuplicate = this.dataSource.data.some(
        (role: any) => role.roleName.trim().toLowerCase() === roleName,
      );

      if (isDuplicate) {
        this.notificationService.showError('Role already exists!');
        return;
      }

      // Create role object
      let roleObj = {
        roleName: this.addRolesForm.value.roleName,
        roleDisplayName: this.addRolesForm.value.roleDisplayName,
        remarks: this.addRolesForm.value.remarks,
        status: '1', // Default to active for all new records
      };

      this.service.post('api/Roles/CreateRole', roleObj).subscribe({
        next: () => {
          this.notificationService.showSuccess('Saved Successfully');
          this.addRolesForm.reset();
          this.router.navigate(['userRolesAndPermissions/roles']);
        },
        error: (err) => {
          this.notificationService.showError('Failed to save role');
          console.error('Error creating role:', err);
        },
      });
    } else {
      this.notificationService.showError(
        'Error in form. Please check all fields.',
      );
    }
  }

  goBack(): void {
    this.location.back();
  }
}
