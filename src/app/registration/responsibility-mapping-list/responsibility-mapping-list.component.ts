import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../shared/services/notification.service';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';

@Component({
  selector: 'app-responsibility-mapping-list',
  imports: [NemoReusableTblComponent],
  templateUrl: './responsibility-mapping-list.component.html',
  styleUrls: ['./responsibility-mapping-list.component.scss'],
})
export class ResponsibilityMappingListComponent {
  onDeleteRequest: boolean = true;
  onDetail: boolean = false;
  dataArray: any[] = [];
  columns: any[] = [];
  originalDataArray: any[] = [];
  constructor(
    private router: Router,
    private responsibilityService: ResponsibilityService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadResponsibilityList();
  }

  initializeColumns() {
    this.columns = [
      { field: 'srNo', header: '#' },
      { field: 'empId', header: 'Emp.Id' },
      { field: 'name', header: 'Emp. Name' },
      { field: 'responsibility', header: 'Responsibility' },
      { field: 'branch', header: 'Branch' },
      { field: 'department', header: 'Department' },
      { field: 'designation', header: 'Designation' },
      { field: 'status', header: 'Status' },
    ];

    console.log('Columns initialized:', this.columns);
  }

  onSearch(event: any) {
    const searchTerm = event?.toString().toLowerCase().trim() || '';
    if (!searchTerm) {
      this.dataArray = [...this.originalDataArray];
      return;
    }
    this.dataArray = this.originalDataArray.filter((item) =>
      Object.keys(item).some((key) => {
        const val = item[key];
        return val && val.toString().toLowerCase().includes(searchTerm);
      }),
    );
  }
  addResponsibility() {
    this.router.navigate(['responsibility/addMappingResponsibilityList']);
  }
  onEditRow(event: any) {
    console.log('Edit row data:', event);
    const id = event.employeeResponsblityMappingID;
    if (id) {
      this.router.navigate(['responsibility/updateMappingResponsibilityList'], {
        queryParams: { id: id },
      });
    } else {
      this.notificationService.showError(
        'Invalid Employee Responsibility Mapping ID',
      );
    }
  }

  deleteList(data: any) {
    console.log('Delete row data:', data);
    const id = data.employeeResponsblityMappingID;

    if (!id) {
      this.notificationService.showError('Invalid Responsibility ID');
      return;
    }
    if (
      confirm(
        'Are you sure you want to delete this employee responsibility mapping?',
      )
    ) {
      this.responsibilityService
        .deleteEmployeeResponsibilityMapping(id)
        .subscribe({
          next: (response: any) => {
            this.notificationService.showSuccess(
              'Employee responsibility mapping deleted successfully',
            );
            this.loadResponsibilityList(); // Reload the list after deletion
          },
          error: (error: any) => {
            this.notificationService.showError(
              'Failed to delete employee responsibility mapping',
            );
            console.error(
              'Error deleting employee responsibility mapping:',
              error,
            );
          },
        });
    }
  }

  loadResponsibilityList() {
    this.responsibilityService
      .getEmployeeResponsibilityMappingList()
      .subscribe({
        next: (response: any[]) => {
          console.log('API Response:', response);

          this.dataArray = response.map((item, index) => ({
            srNo: index + 1,
            employeeResponsblityMappingID: item.employeeResponsblityMappingID,
            empId: item.employeeId || 'N/A',
            name: item.employeeName || 'N/A',
            responsibility: item.responsibilityNames?.join(', ') || 'N/A',
            branch: item.branchName || 'N/A',
            department: item.departmentName || 'N/A',
            designation: item.designationName || 'N/A',
            status: item.status === 1 ? 'Active' : 'Inactive',
          }));

          this.originalDataArray = [...this.dataArray];
          console.log('Data Array:', this.dataArray);
        },
        error: (err: any) => {
          console.error(
            'Error loading employee responsibility mapping list',
            err,
          );
          this.notificationService.showError(
            'Failed to load employee responsibility mapping list',
          );
        },
      });
  }
}
