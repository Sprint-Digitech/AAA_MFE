import { Component } from '@angular/core';
import { AddUpdateFormComponent, FormConfig } from '@fovestta2/web-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { UtilityService } from '../../shared/services/utility.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-responsibility-list',
  imports: [AddUpdateFormComponent, CommonModule],
  templateUrl: './add-responsibility-list.component.html',
  styleUrls: ['./add-responsibility-list.component.scss'],
})
export class AddResponsibilityListComponent {
  addResponsibilityFormLoaded: boolean = false;
  addResponsibilityFormConfig!: FormConfig;
  isEditMode = false;
  responsibilityId: string = '';

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private responsibilityService: ResponsibilityService,
  ) {}
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.responsibilityId = params['id'];
        this.fetchResponsibilityById(this.responsibilityId);
      } else {
        this.initializeFormConfig();
        this.addResponsibilityFormLoaded = true;
      }
    });
  }
  fetchResponsibilityById(id: string) {
    this.responsibilityService.getResponsibilityById(id).subscribe({
      next: (response: any[]) => {
        const initialValues = {
          responsibilityName: response[0].responsiblityName,
          name: response[0].responsiblityDisplayName,
          remarks: response[0].remark,
          status: response[0].status,
        };
        this.initializeFormConfig(initialValues);
        this.addResponsibilityFormLoaded = true;
      },
      error: (error) => {
        this.notificationService.showError(
          'Failed to fetch responsibility details',
        );
        console.error('Error fetching responsibility:', error);
        this.goBack();
      },
    });
  }
  initializeFormConfig(initialValues?: any) {
    this.addResponsibilityFormConfig = {
      formTitle: this.isEditMode
        ? 'Update Responsibility'
        : 'Add Responsibility',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'responsibilityName',
              label: 'Responsibility Name',
              type: 'text',
              colSpan: 1,
              value: initialValues?.responsibilityName || '',
              validations: [
                {
                  type: 'required',
                  message: 'Responsibility Name is required',
                },
                {
                  type: 'maxLength',
                  message: 'Max 10 characters allowed',
                  value: 10,
                },
                {
                  type: 'pattern',
                  message: 'Only alphanumeric allowed',
                  value: '^[a-zA-Z0-9]+$',
                },
              ],
            },
            {
              name: 'name',
              label: 'Display Name',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              allowAlphabetsOnly: true,
              value: initialValues?.name || '',
              validations: [
                { type: 'required', message: 'Display Name is required' },
                {
                  type: 'maxLength',
                  value: 50,
                  message: 'Max 50 characters allowed',
                },
              ],
            },
            {
              name: 'remarks',
              label: 'Remarks',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              allowAlphabetsOnly: true,
              value: initialValues?.remarks || '',
              validations: [
                { type: 'required', message: 'Bank Name is required' },
                {
                  type: 'maxLength',
                  value: 50,
                  message: 'Max 50 characters allowed',
                },
              ],
            },

            {
              name: 'status',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              value: initialValues
                ? String(UtilityService.normalizeStatus(initialValues.status))
                : '1',
              hidden: !this.isEditMode,
              options: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
              ],
              validations: [
                { type: 'required', message: 'Status is required' },
              ],
            },
          ],
        },
      ],
      submitLabel: this.isEditMode ? 'Update' : 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Back',
      onSubmit: (data: any) => this.onSubmit(data),
      onCancel: () => this.goBack(),
    };
  }
  onSubmit(data: any) {
    if (this.isEditMode) {
      this.updateResponsibility(data);
    } else {
      this.createResponsibility(data);
    }
  }

  createResponsibility(data: any) {
    const payload = {
      responsiblityMasterID: UtilityService.generateGuid(),
      responsiblityName: data.responsibilityName,
      responsiblityDisplayName: data.name,
      remark: data.remarks,
      status: 1,
    };

    this.responsibilityService.createResponsibility(payload).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(
          'Responsibility created successfully',
        );
        this.goBack();
      },
      error: (error) => {
        this.notificationService.showError('Failed to create responsibility');
        console.error('Error creating responsibility:', error);
      },
    });
  }

  updateResponsibility(data: any) {
    const payload = {
      responsiblityMasterID: this.responsibilityId,
      responsiblityName: data.responsibilityName,
      responsiblityDisplayName: data.name,
      remark: data.remarks,
      status: parseInt(data.status),
    };

    this.responsibilityService.updateResponsibility(payload).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(
          'Responsibility updated successfully',
        );
        this.goBack();
      },
      error: (error) => {
        this.notificationService.showError('Failed to update responsibility');
        console.error('Error updating responsibility:', error);
      },
    });
  }

  goBack() {
    this.router.navigate(['responsibility/responsibility-list']);
  }
}
