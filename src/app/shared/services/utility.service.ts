import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  /**
   * Converts various status formats to numeric (1 or 0)
   * Handles: 1, '1', true, 'Yes', 'Active' -> 1
   *         0, '0', false, 'No', 'Inactive' -> 0
   */
  static normalizeStatus(status: any): number {
    if (
      status === 1 ||
      status === '1' ||
      status === true ||
      status === 'Yes' ||
      status === 'Active'
    ) {
      return 1;
    }
    if (
      status === 0 ||
      status === '0' ||
      status === false ||
      status === 'No' ||
      status === 'Inactive'
    ) {
      return 0;
    }
    return status === '' || status === null || status === undefined ? 1 : 0;
  }

  /**
   * Converts status to Yes/No string
   */
  static statusToYesNo(status: any): string {
    return this.normalizeStatus(status) === 1 ? 'Yes' : 'No';
  }

  /**
   * Converts Yes/No to status number
   */
  static yesNoToStatus(value: string | boolean | number): number {
    if (value === 'Yes' || value === true || value === 1 || value === '1') {
      return 1;
    }
    return 0;
  }

  /**
   * Generates a GUID
   */
  static generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Maps array items with serial numbers
   */
  static mapWithSerialNumbers<T extends Record<string, any>>(items: T[]): T[] {
    return items.map((item, index) => ({
      ...item,
      srNo: (index + 1).toString().padStart(2, '0'),
    }));
  }

  /**
   * Filters array by status
   */
  static filterByStatus<T extends { status?: any }>(
    items: T[],
    activeOnly: boolean = true
  ): T[] {
    if (!activeOnly) return items;
    return items.filter((item) => this.normalizeStatus(item.status) === 1);
  }

  /**
   * Validates if a record with the same unique combination already exists
   * @param existingRecords Array of existing records to check against
   * @param newRecord The new record to validate
   * @param uniqueFields Array of field names that form the unique combination
   * @param excludeId Optional ID to exclude from validation (for update scenarios)
   * @returns Object with isValid boolean and errorMessage string
   */
  static validateUniqueRecord(
    existingRecords: any[],
    newRecord: any,
    uniqueFields: string[],
    excludeId?: string,
    idFieldName: string = 'id'
  ): { isValid: boolean; errorMessage: string } {
    const matchingRecord = existingRecords.find((existing) => {
      // Skip the current record if updating
      if (excludeId && existing[idFieldName] === excludeId) {
        return false;
      }

      // Check if all unique fields match
      return uniqueFields.every((field) => {
        const existingValue = String(existing[field] || '')
          .trim()
          .toLowerCase();
        const newValue = String(newRecord[field] || '')
          .trim()
          .toLowerCase();
        return existingValue === newValue && existingValue !== '';
      });
    });

    if (matchingRecord) {
      const fieldLabels = uniqueFields
        .map((f) => f.charAt(0).toUpperCase() + f.slice(1))
        .join(', ');
      return {
        isValid: false,
        errorMessage: `A record with the same ${fieldLabels} already exists.`,
      };
    }

    return { isValid: true, errorMessage: '' };
  }

  /**
   * Finds all active records that should be inactivated when a new active record is created
   * @param existingRecords Array of existing records
   * @param filterCriteria Optional function to filter which records should be inactivated
   * @returns Array of records that should be inactivated
   */
  static findRecordsToInactivate(
    existingRecords: any[],
    filterCriteria?: (record: any) => boolean
  ): any[] {
    const activeRecords = existingRecords.filter(
      (record) => this.normalizeStatus(record.status) === 1
    );

    if (filterCriteria) {
      return activeRecords.filter(filterCriteria);
    }

    return activeRecords;
  }

  /**
   * Normalizes a string for duplicate comparison by:
   * - Trimming leading/trailing spaces
   * - Replacing multiple consecutive spaces with a single space
   * - Converting to lowercase
   * @param value The string value to normalize
   * @returns Normalized string for comparison
   */
  static normalizeStringForComparison(
    value: string | null | undefined
  ): string {
    if (!value) return '';
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * Trims all string values in an object (recursively)
   * This prevents duplicate entries with extra spaces
   * @param obj The object to trim
   * @param excludeFields Optional array of field names to exclude from trimming
   * @returns A new object with all string values trimmed
   */
  static trimStringValues<T extends Record<string, any>>(
    obj: T,
    excludeFields: string[] = []
  ): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const trimmed: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // Skip excluded fields
        if (excludeFields.includes(key)) {
          trimmed[key] = value;
          continue;
        }

        // Trim strings
        if (typeof value === 'string') {
          trimmed[key] = value.trim();
        }
        // Recursively trim nested objects (exclude Date objects)
        else if (value !== null && typeof value === 'object') {
          // Check if it's a Date object using toString to avoid instanceof issues
          if (Object.prototype.toString.call(value) === '[object Date]') {
            trimmed[key] = value;
          } else {
            trimmed[key] = this.trimStringValues(value, excludeFields);
          }
        }
        // Keep other types as-is
        else {
          trimmed[key] = value;
        }
      }
    }

    return trimmed as T;
  }
}
