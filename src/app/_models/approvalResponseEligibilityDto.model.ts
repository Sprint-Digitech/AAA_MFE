export interface ApprovalResponseEligibilityDto {
    success: boolean;
    message: string;
    approvedEmployees: number[];
    failedEmployees?: { id: number; reason: string }[];
}
