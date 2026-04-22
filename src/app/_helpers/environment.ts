// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  urlAddress: 'https://test.fovestta.com/Auth/sdapi',
  biometricAddress: 'https://test.fovestta.com/employee/sdapi',
  ESSBaseUrl: 'https://test.fovestta.com/employee/sdapi',
  cnbUrlAddress: 'https://test.fovestta.com/salary/sdapi',
  salaryUrlAddress: 'https://test.fovestta.com/salary/sdapi',
  reportsUrl: 'https://test.fovestta.com/salary/sdapi',
  reimbursementUrl: 'https://test.fovestta.com/salary/sdapi',
  EssUrlAddress: 'https://test.fovestta.com/employee/sdapi',
  masterUrlAddress: 'https://test.fovestta.com/master/sdapi',
  hrmsAuthZUrlAddress: 'https://test.fovestta.com/hrmsauthz/sdapi',
  wmsAuthZUrlAddress: 'https://fovesttastag.in/Wmsauthz/sdapi',
  wmsUrlAddress: 'https://fovesttastag.in/wms/sdapi',
  wmsAuthUrlAddress: 'https://fovesttastag.in/Auth/sdapi',
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
