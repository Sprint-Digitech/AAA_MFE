import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RepositoryService } from './repository.service';

export interface Branch {
  id: string | number;
  companyBranchName: string;
  [key: string]: any;
}

export interface BranchFilterOptions {
  label: string;
  value: any;
  field: string;
}

@Injectable({
  providedIn: 'root'
})
export class BranchFilterService {
  constructor(private repository: RepositoryService) { }

  /**
   * Get user data from sessionStorage
   */
  private getUserData(): any {
    const userString = sessionStorage.getItem('user');
    if (!userString) {
      return null;
    }
    try {
      return JSON.parse(userString);
    } catch (error) {
      console.error('Error parsing user data from sessionStorage:', error);
      return null;
    }
  }

  /**
   * Check if the current user is an Admin
   */
  isAdmin(): boolean {
    const userData = this.getUserData();
    if (!userData || !userData.employeeRoleLoginDtos) {
      return false;
    }

    // Check if any role is Admin
    const roles = Array.isArray(userData.employeeRoleLoginDtos)
      ? userData.employeeRoleLoginDtos
      : [userData.employeeRoleLoginDtos];

    return roles.some((role: any) => role?.roleName === 'Admin');
  }

  /**
   * Get the user's branch ID
   */
  getUserBranchId(): string | null {
    const userData = this.getUserData();
    if (!userData || !userData.branchID) {
      return null;
    }
    return userData.branchID.toString();
  }

  /**
   * Get the user's company ID
   */
  getUserCompanyId(): string | null {
    const userData = this.getUserData();
    if (!userData || !userData.companyId) {
      return null;
    }
    return userData.companyId.toString();
  }

  /**
   * Load branches for a company with role-based filtering
   * - Admin users see all branches
   * - Non-admin users see only their associated branch
   * 
   * @param companyId - Company ID (optional, will use user's companyId if not provided)
   * @returns Observable of filtered branches
   */
  loadBranches(companyId?: string): Observable<Branch[]> {
    const targetCompanyId = companyId || this.getUserCompanyId();

    if (!targetCompanyId) {
      throw new Error('Company ID is required to load branches');
    }

    return this.repository.getBranch(
      `api/company-branch/GetCompanyBranchByCompanyId?CompanyId=${targetCompanyId}`
    ).pipe(
      map((data: any[]) => {
        // Convert branch IDs to strings for consistency
        let allBranches: Branch[] = data.map((branch: any) => ({
          ...branch,
          id: branch.id.toString()
        }));

        // Filter branches based on user role
        if (!this.isAdmin()) {
          const userBranchId = this.getUserBranchId();
          if (userBranchId) {
            allBranches = allBranches.filter(branch => branch.id === userBranchId);
          } else {
            // If user is not admin and has no branch ID, return empty array
            allBranches = [];
          }
        }

        return allBranches;
      })
    );
  }

  /**
   * Create filter options array for dropdowns
   * Includes "All Branches" option and individual branch options
   * 
   * @param branches - Array of branches
   * @param fieldName - Field name to use for filtering (default: 'branchId')
   * @returns Array of filter options
   */
  createFilterOptions(branches: Branch[], fieldName: string = 'branchId'): BranchFilterOptions[] {
    return [
      { label: 'All Branches', value: 'all', field: fieldName },
      ...branches.map((branch: Branch) => ({
        label: branch.companyBranchName,
        value: branch.id,
        field: fieldName
      }))
    ];
  }

  /**
   * Get user's login data (for backward compatibility)
   */
  getLoginData(): any {
    return this.getUserData();
  }

  /**
   * Get user's role information
   */
  getEmployeeRoleLoginDtos(): any {
    const userData = this.getUserData();
    if (!userData || !userData.employeeRoleLoginDtos) {
      return null;
    }

    // Return first role if array, or the role object itself
    return Array.isArray(userData.employeeRoleLoginDtos)
      ? userData.employeeRoleLoginDtos[0]
      : userData.employeeRoleLoginDtos;
  }
}

