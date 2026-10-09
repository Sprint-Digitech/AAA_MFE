// Fovestta Desktop (Electron) build: `ng build login --configuration desktop`.
// Same keys as environment.ts; only the origin differs. Every URL points at app://fovestta,
// which the desktop app serves locally (MFE files) or forwards through its local service to
// the selected cloud deployment (app.fovestta.com or attendance.bubnaadvertising.com).
// Not used by the production, development or bubna builds.

export const environment = {
  production: true,
  domain: 'app://fovestta',
  urlAddress: 'app://fovestta/Auth/sdapi',
  biometricAddress: 'app://fovestta/Employee/sdapi',
  ESSBaseUrl: 'app://fovestta/Employee/sdapi',
  cnbUrlAddress: 'app://fovestta/Salary/sdapi',
  salaryUrlAddress: 'app://fovestta/Salary/sdapi',
  reportsUrl: 'app://fovestta/Salary/sdapi',
  reimbursementUrl: 'app://fovestta/Salary/sdapi',
  EssUrlAddress: 'app://fovestta/Employee/sdapi',
  masterUrlAddress: 'app://fovestta/master/sdapi',
  hrmsAuthZUrlAddress: 'app://fovestta/Hrmsauthz/sdapi',
  wmsAuthZUrlAddress: 'app://fovestta/Hrmsauthz/sdapi',
  wmsUrlAddress: 'app://fovestta/wms/sdapi',
  wmsAuthUrlAddress: 'app://fovestta/Auth/sdapi',
  almsUrlAddress: 'app://fovestta/alms/sdapi',
  chatUrlAddress: 'app://fovestta/chat/sdapi',
  employeeMfeUrl: 'app://fovestta/Employee/dist/',
  salaryMfeUrl: 'app://fovestta/Salary/dist/',
  almsMfeUrl: 'app://fovestta/ALMS/dist/',
  authMfeUrl: 'app://fovestta/Auth/dist',
  // Same value as environment.ts; the POS integration service is not reachable from the desktop app.
  wmsIntegrationUrl: 'http://localhost:8095',
};
