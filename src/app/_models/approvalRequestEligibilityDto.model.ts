export interface ApprovalRequestEligibilityDto {
    employeeIds: number[];
    approvalDate: Date;
    bonusPercentage?: number;
    comments?: string;
}
