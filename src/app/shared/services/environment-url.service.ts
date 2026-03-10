import { environment } from '../../_helpers/environment';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentUrlService {
  public urlAddress: string = environment.urlAddress;
  public salaryUrlAddress: string = environment.salaryUrlAddress || environment.urlAddress;
  public essUrlAddress: string = environment.EssUrlAddress || environment.urlAddress;

  constructor() { }

  public getBaseUrl(route: string | any): string {
    if (typeof route !== 'string') return this.urlAddress;
    const routeLower = route.toLowerCase();

    // Priority 1: CAB/Salary Migrated Routes
    if (routeLower.includes('reference_data') ||
      routeLower.includes('attendance') ||
      routeLower.includes('salary') ||
      routeLower.includes('payroll') ||
      routeLower.includes('arrear') ||
      routeLower.includes('bonus') ||
      routeLower.includes('tds') ||
      routeLower.includes('payhead') ||
      routeLower.includes('gratuity') ||
      routeLower.includes('leave') ||
      routeLower.includes('holiday') ||
      routeLower.includes('alms') ||
      routeLower.includes('companybranch')) {
      return this.salaryUrlAddress;
    }

    return this.urlAddress;
  }
}
