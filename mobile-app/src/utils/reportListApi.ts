export const SERVICE_REPORT_TYPE = 'Service_Report';
export const RENTAL_REPORT_TYPE = 'Rental_Report';

export const REPORT_SEND_N8N_WEBHOOK =
  'https://n8n.nicknameinfo.net/webhook/88ed0a9b-ee21-43e0-9684-f5c5859f9734';

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
