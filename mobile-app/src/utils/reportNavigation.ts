import {
  isGatePassReportType,
  isOperationalDocumentReportType,
  getDocumentTitle,
  getDocumentListScreen,
  SERVICE_GATE_PASS,
  SERVICE_DELIVERY_CHALLAN,
  SERVICE_RETURNABLE_CHALLAN,
  RENTAL_GATE_PASS,
  RENTAL_DELIVERY_CHALLAN,
  RENTAL_RETURNABLE_CHALLAN,
  SERVICE_REPORT_TYPE,
  RENTAL_REPORT_TYPE,
} from './reportDocumentTypes';
import {
  SERVICE_GATE_PASS_TYPE,
  RENTAL_GATE_PASS_TYPE,
  SERVICE_DELIVERY_CHALLAN_TYPE,
  RENTAL_DELIVERY_CHALLAN_TYPE,
  SERVICE_RETURNABLE_CHALLAN_TYPE,
  RENTAL_RETURNABLE_CHALLAN_TYPE,
} from './reportListApi';

export const getServicePayloadReportFor = (resolvedType?: string) =>
  isOperationalDocumentReportType(resolvedType) ? resolvedType : 'service';

export const getRentalPayloadReportFor = (resolvedType?: string) =>
  isOperationalDocumentReportType(resolvedType) ? resolvedType : 'rental';

export const resolveServiceReportType = (reportFor?: string) => {
  if (reportFor === SERVICE_GATE_PASS_TYPE || reportFor === SERVICE_GATE_PASS) {
    return SERVICE_GATE_PASS_TYPE;
  }
  if (reportFor === SERVICE_DELIVERY_CHALLAN_TYPE || reportFor === SERVICE_DELIVERY_CHALLAN) {
    return SERVICE_DELIVERY_CHALLAN_TYPE;
  }
  if (reportFor === SERVICE_RETURNABLE_CHALLAN_TYPE || reportFor === SERVICE_RETURNABLE_CHALLAN) {
    return SERVICE_RETURNABLE_CHALLAN_TYPE;
  }
  if (reportFor === SERVICE_REPORT_TYPE || reportFor === 'Service_Report') {
    return SERVICE_REPORT_TYPE;
  }
  return SERVICE_REPORT_TYPE;
};

export const resolveRentalReportType = (reportFor?: string) => {
  if (reportFor === RENTAL_GATE_PASS_TYPE || reportFor === RENTAL_GATE_PASS) {
    return RENTAL_GATE_PASS_TYPE;
  }
  if (reportFor === RENTAL_DELIVERY_CHALLAN_TYPE || reportFor === RENTAL_DELIVERY_CHALLAN) {
    return RENTAL_DELIVERY_CHALLAN_TYPE;
  }
  if (reportFor === RENTAL_RETURNABLE_CHALLAN_TYPE || reportFor === RENTAL_RETURNABLE_CHALLAN) {
    return RENTAL_RETURNABLE_CHALLAN_TYPE;
  }
  if (reportFor === RENTAL_REPORT_TYPE || reportFor === 'Rental_Report') {
    return RENTAL_REPORT_TYPE;
  }
  return RENTAL_REPORT_TYPE;
};

export const getServiceListScreen = (reportType?: string) =>
  isOperationalDocumentReportType(reportType)
    ? getDocumentListScreen(reportType)
    : 'ServiceReports';

export const getRentalListScreen = (reportType?: string) =>
  isOperationalDocumentReportType(reportType)
    ? getDocumentListScreen(reportType)
    : 'RentalReports';

export const getServiceReportScreenTitle = (reportType?: string) =>
  isOperationalDocumentReportType(reportType) ? getDocumentTitle(reportType) : 'Service Report';

export const getRentalReportScreenTitle = (reportType?: string) =>
  isOperationalDocumentReportType(reportType) ? getDocumentTitle(reportType) : 'Rental Report';

export { isGatePassReportType, isOperationalDocumentReportType, getDocumentTitle };
