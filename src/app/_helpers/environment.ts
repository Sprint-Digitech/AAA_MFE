// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  domain: 'https://app.fovestta.com',
  urlAddress: 'https://app.fovestta.com/Auth/sdapi',
  biometricAddress: 'https://app.fovestta.com/Employee/sdapi',
  ESSBaseUrl: 'https://app.fovestta.com/Employee/sdapi',
  cnbUrlAddress: 'https://app.fovestta.com/Salary/sdapi',
  salaryUrlAddress: 'https://app.fovestta.com/Salary/sdapi',
  reportsUrl: 'https://app.fovestta.com/Salary/sdapi',
  reimbursementUrl: 'https://app.fovestta.com/Salary/sdapi',
  EssUrlAddress: 'https://app.fovestta.com/Employee/sdapi',
  masterUrlAddress: 'https://app.fovestta.com/master/sdapi',
  hrmsAuthZUrlAddress: 'https://app.fovestta.com/Hrmsauthz/sdapi',
  wmsAuthZUrlAddress: 'https://app.fovestta.com/Hrmsauthz/sdapi',
  wmsUrlAddress: 'https://app.fovestta.com/wms/sdapi',
  wmsAuthUrlAddress: 'https://app.fovestta.com/Auth/sdapi',
  almsUrlAddress: 'https://app.fovestta.com/alms/sdapi',
  chatUrlAddress: 'https://app.fovestta.com/chat/sdapi',
  employeeMfeUrl: 'https://app.fovestta.com/Employee/dist/',
  salaryMfeUrl: 'https://app.fovestta.com/Salary/dist/',
  almsMfeUrl: 'https://app.fovestta.com/ALMS/dist/',
  authMfeUrl: 'https://app.fovestta.com/Auth/dist',
  // POS SaaS integration service — update this URL when the WMS Integration Service is deployed
  wmsIntegrationUrl: 'http://localhost:8095',
};

// Alternative for development with TLS issues:
// export const environment = {
//   production: false,
//   urlAddress: 'http://localhost:5000',
//   biometricAddress: 'http://localhost:5000',
//   ESSBaseUrl: 'http://localhost:5000'
// };




/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
