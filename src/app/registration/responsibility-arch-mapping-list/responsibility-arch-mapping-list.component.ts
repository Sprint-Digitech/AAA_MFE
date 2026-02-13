import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ResponsibilityService } from '../../shared/services/responsibility.service';
import { NotificationService } from '../../shared/services/notification.service';
import { NemoReusableTblComponent } from '@fovestta2/nemo-reusable-tbl-fovestta';
@Component({
  selector: 'app-responsibility-arch-mapping-list',
  imports: [NemoReusableTblComponent],
  templateUrl: './responsibility-arch-mapping-list.component.html',
  styleUrls: ['./responsibility-arch-mapping-list.component.scss'],
})
export class ResponsibilityArchMappingListComponent {
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
      { field: 'branch', header: 'Branch Name' },
      { field: 'department', header: 'Department' },
      { field: 'designation', header: 'Designation' },
      { field: 'responsibility', header: 'Responsibility' },
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
    this.router.navigate(['responsibility/addArchResponsibilityMappingList']);
  }
  onEditRow(event: any) {
    console.log('Edit row data:', event);
    const id = event.responsibilityArchMappingID;
    if (id) {
      this.router.navigate(
        ['responsibility/updateArchResponsibilityMappingList'],
        {
          queryParams: { id: id },
        },
      );
    } else {
      this.notificationService.showError('Invalid Responsibility ID');
    }
  }

  deleteList(data: any) {
    console.log('Delete row data:', data);
    const id = data.responsibilityArchMappingID;

    if (!id) {
      this.notificationService.showError('Invalid Responsibility Mapping ID');
      return;
    }
    if (
      confirm('Are you sure you want to delete this responsibility mapping?')
    ) {
      this.responsibilityService.deleteResponsibilityArchMapping(id).subscribe({
        next: (response) => {
          this.notificationService.showSuccess(
            'Responsibility mapping deleted successfully',
          );
          this.loadResponsibilityList(); // Reload the list after deletion
        },
        error: (error) => {
          this.notificationService.showError(
            'Failed to delete responsibility mapping',
          );
          console.error('Error deleting responsibility mapping:', error);
        },
      });
    }
  }

  loadResponsibilityList() {
    this.responsibilityService.getResponsibilityArchMappingList().subscribe({
      next: (response: any[]) => {
        this.dataArray = response.map((item, index) => ({
          srNo: index + 1,
          responsibilityArchMappingID: item.responsibilityArchMappingID,
          branch: item.branchNames?.join(', ') || 'N/A',
          department: item.departmentNames?.join(', ') || 'N/A',
          designation: item.designationNames?.join(', ') || 'N/A',
          responsibility: item.responsibilityNames?.join(', ') || 'N/A', // Assuming API returns this
          status: item.status === 1 ? 'Active' : 'Inactive',
        }));

        this.originalDataArray = [...this.dataArray];
        console.log('Data loaded:', this.dataArray);
      },
      error: (err: any) => {
        console.error('Error loading responsibility mapping list', err);
        this.notificationService.showError(
          'Failed to load responsibility mapping list',
        );
      },
    });
  }
}
