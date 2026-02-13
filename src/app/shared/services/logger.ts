import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Logger {
  
  private logs: { timestamp: string; level: string; message: string; context?: any }[] = [];

  logInformation(message: string, context?: any): void {
    this.log('info', message, context);
  }

  logError(message: string, context?: any): void {
    this.log('error', message, context);
  }

  logWarning(message: string, context?: any): void {
    this.log('warn', message, context);
  }

    // New method for validation logs
  logValidation(message: string, isValid: boolean, context?: any): void {
    const validationStatus = isValid ? 'VALIDATION PASSED' : 'VALIDATION FAILED';
    const logMessage = `${validationStatus}: ${message}`;
    this.log(isValid ? 'info' : 'warn', logMessage, context);
  }


  private log(level: string, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, context };
    this.logs.push(logEntry);

    const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    switch (level) {
      case 'info':
        console.info(logMessage, context || '');
        break;
      case 'warn':
        console.warn(logMessage, context || '');
        break;
      case 'error':
        console.error(logMessage, context || '');
        break;
      default:
        console.log(logMessage, context || '');
    }
  }

  // Download logs as a file
  // downloadLogs(): void {
  //   const logBlob = new Blob([this.formatLogsForDownload()], { type: 'text/plain' });
  //   const downloadLink = document.createElement('a');
  //   downloadLink.href = window.URL.createObjectURL(logBlob);
  //   downloadLink.download = `app-logs-${new Date().toISOString()}.txt`;
  //   downloadLink.click();
  // }
  downloadLogs(): void {
    console.log('Attempting to download logs...');
    const formattedLogs = this.formatLogsForDownload(); // Ensure this is well-defined
    // const logBlob = new Blob([this.formatLogsForDownload()], { type: 'text/plain' });
    const logBlob = new Blob([formattedLogs], { type: 'text/plain' });
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(logBlob);
    downloadLink.download = `app-logs-${new Date().toISOString()}.txt`;
    downloadLink.click();
    console.log('Download triggered');
  }
  

  // Format logs for download
  private formatLogsForDownload(): string {
    return this.logs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}]: ${log.message}`)
      .join('\n');
  }




}
