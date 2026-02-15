export interface EmployeeEligibilityDto {
    id: number;
    name: string;
    department: string;
    salary: number;
    workingDays: number;
    selected?: boolean;
}
