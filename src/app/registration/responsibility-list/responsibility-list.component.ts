import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { NotificationService } from '../../shared/services/notification.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';

@Component({
  selector: 'app-responsibility-list',
  imports: [NemoReusableTblComponent],
  templateUrl: './responsibility-list.component.html',
  styleUrls: ['./responsibility-list.component.scss'],
})
export class ResponsibilityListComponent {
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
      { field: 'responsiblityName', header: 'Responsibility' },
      { field: 'responsiblityDisplayName', header: 'Display Name' },
      { field: 'remark', header: 'Remarks' },
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
    this.router.navigate(['responsibility/addResponsibilityList']);
  }
  onEditRow(event: any) {
    console.log('Edit row data:', event);
    const id = event.responsiblityMasterID;
    if (id) {
      this.router.navigate(['responsibility/addResponsibilityList'], {
        queryParams: { id: id },
      });
    } else {
      this.notificationService.showError('Invalid Responsibility ID');
    }
  }

  deleteList(data: any) {
    console.log('Delete row data:', data);
    const id = data.responsiblityMasterID;

    if (!id) {
      this.notificationService.showError('Invalid Responsibility ID');
      return;
    }

    // Optional: Add confirmation dialog
    if (confirm('Are you sure you want to delete this responsibility?')) {
      this.responsibilityService.deleteResponsibility(id).subscribe({
        next: (response) => {
          this.notificationService.showSuccess(
            'Responsibility deleted successfully',
          );
          this.loadResponsibilityList(); // Reload the list after deletion
        },
        error: (error) => {
          this.notificationService.showError('Failed to delete responsibility');
          console.error('Error deleting responsibility:', error);
        },
      });
    }
  }

  loadResponsibilityList() {
    this.responsibilityService
      .getResponsibilityList('api/Responsibility/GetResponsibilities')
      .subscribe({
        next: (response: any[]) => {
          this.dataArray = response.map((item, index) => ({
            srNo: index + 1,
            responsiblityMasterID: item.responsiblityMasterID,
            responsiblityName: item.responsiblityName,
            responsiblityDisplayName: item.responsiblityDisplayName,
            remark: item.remark,
            status: item.status === 1 ? 'Active' : 'Inactive',
          }));

          this.originalDataArray = [...this.dataArray];
        },
        error: (err: any) => {
          console.error('Error loading responsibility list', err);
          this.notificationService.showError(
            'Failed to load responsibility list',
          );
        },
      });
  }
}
