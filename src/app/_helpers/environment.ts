// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  urlAddress: 'https://dev.fovestta.com/auth',
  biometricAddress: 'https://localhost:7230',
  ESSBaseUrl: 'https://dev.fovestta.com/employee',
  cnbUrlAddress: 'https://localhost:7245',
  salaryUrlAddress: 'https://dev.fovestta.com/master',
  reportsUrl: 'https://localhost:7225',
  reimbursementUrl: 'https://localhost:7281',
  EssUrlAddress: 'https://dev.fovestta.com/employee',
  masterUrlAddress: 'https://dev.fovestta.com/master',
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
