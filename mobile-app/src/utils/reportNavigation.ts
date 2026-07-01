import {
  isGatePassReportType,
  SERVICE_GATE_PASS_TYPE,
  RENTAL_GATE_PASS_TYPE,
  SERVICE_REPORT_TYPE,
  RENTAL_REPORT_TYPE,
} from './reportListApi';

export const resolveServiceReportType = (reportFor?: string) => {
  if (reportFor === SERVICE_GATE_PASS_TYPE || reportFor === 'Service_Gate_Pass') {
    return SERVICE_GATE_PASS_TYPE;
  }
  if (reportFor === SERVICE_REPORT_TYPE || reportFor === 'Service_Report') {
    return SERVICE_REPORT_TYPE;
  }
  return SERVICE_REPORT_TYPE;
};

export const resolveRentalReportType = (reportFor?: string) => {
  if (reportFor === RENTAL_GATE_PASS_TYPE || reportFor === 'Rental_Gate_Pass') {
    return RENTAL_GATE_PASS_TYPE;
  }
  if (reportFor === RENTAL_REPORT_TYPE || reportFor === 'Rental_Report') {
    return RENTAL_REPORT_TYPE;
  }
  return RENTAL_REPORT_TYPE;
};

export const getServiceListScreen = (reportType?: string) =>
  isGatePassReportType(reportType) ? 'ServiceGatePass' : 'ServiceReports';

export const getRentalListScreen = (reportType?: string) =>
  isGatePassReportType(reportType) ? 'RentalGatePass' : 'RentalReports';

export const getServiceReportScreenTitle = (reportType?: string) =>
  isGatePassReportType(reportType) ? 'Gate Pass' : 'Service Report';

export const getRentalReportScreenTitle = (reportType?: string) =>
  isGatePassReportType(reportType) ? 'Gate Pass' : 'Rental Report';
