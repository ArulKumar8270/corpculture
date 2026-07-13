import {
  isOperationalDocumentReportType,
} from './reportDocumentTypes';

export const SERVICE_REPORT_TYPE = 'Service_Report';
export const RENTAL_REPORT_TYPE = 'Rental_Report';
export const SERVICE_GATE_PASS_TYPE = 'Service_Gate_Pass';
export const RENTAL_GATE_PASS_TYPE = 'Rental_Gate_Pass';
export const SERVICE_DELIVERY_CHALLAN_TYPE = 'Service_Delivery_Challan';
export const RENTAL_DELIVERY_CHALLAN_TYPE = 'Rental_Delivery_Challan';
export const SERVICE_RETURNABLE_CHALLAN_TYPE = 'Service_Returnable_Challan';
export const RENTAL_RETURNABLE_CHALLAN_TYPE = 'Rental_Returnable_Challan';

export {
  isGatePassReportType,
  isOperationalDocumentReportType,
  getDocumentTitle,
  getDocumentListScreen,
} from './reportDocumentTypes';

export const REPORT_SEND_N8N_WEBHOOK =
  'https://n8n.nicknameinfo.net/webhook/88ed0a9b-ee21-43e0-9684-f5c5859f9734';
export const GATE_PASS_SEND_N8N_WEBHOOK =
  'https://n8n.nicknameinfo.net/webhook/232a4cac-a830-4a4c-a848-dbf66d242d79';

export const getReportSendWebhook = (reportType?: string) =>
  isOperationalDocumentReportType(reportType) ? GATE_PASS_SEND_N8N_WEBHOOK : REPORT_SEND_N8N_WEBHOOK;

export type ReportListFilterValues = {
  fromDate: string;
  toDate: string;
  companyName: string;
  assignedTo: string;
  serialNo: string;
};

export function buildReportListQueryParams(
  filters: ReportListFilterValues,
  reportTypeKey: string,
  page: number,
  rowsPerPage: number
): URLSearchParams {
  return new URLSearchParams({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    companyName: filters.companyName,
    assignedTo: filters.assignedTo,
    serialNo: filters.serialNo,
    reportType: reportTypeKey,
    page: String(page + 1),
    limit: String(rowsPerPage),
  });
}

export function getReportsListUrl(
  baseUrl: string,
  reportTypeKey: string,
  userRole: number | undefined,
  userId: string | undefined,
  query: URLSearchParams
): string {
  const qs = query.toString();
  if (Number(userRole) === 3 && userId) {
    return `${baseUrl}/report/getByassigned/${userId}/${reportTypeKey}${qs ? `?${qs}` : ''}`;
  }
  return `${baseUrl}/report/${reportTypeKey}${qs ? `?${qs}` : ''}`;
}
