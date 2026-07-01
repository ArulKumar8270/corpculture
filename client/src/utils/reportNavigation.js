/** List page paths keyed by reportType */
export const getReportListPath = (reportType) => {
    switch (reportType) {
        case 'Service_Gate_Pass':
            return '../serviceGatePassList';
        case 'Rental_Gate_Pass':
            return '../rentalGatePassList';
        case 'Rental_Report':
            return '../rentalReportlist';
        case 'Service_Report':
        default:
            return '../serviceReportlist';
    }
};

/** Add/edit form path (no id) keyed by reportType */
export const getReportFormPath = (reportType) => {
    switch (reportType) {
        case 'Service_Gate_Pass':
            return '../addServiceGatePass';
        case 'Rental_Gate_Pass':
            return '../addRentalGatePass';
        case 'Rental_Report':
            return '../addRentalReport';
        case 'Service_Report':
        default:
            return '../addServiceReport';
    }
};

/** Edit form path with report id */
export const getReportEditPath = (reportType, reportId) => {
    const base = getReportFormPath(reportType).replace('../', '');
    return `../${base}/${reportId}`;
};

export const isGatePassReportType = (reportType) =>
    reportType === 'Service_Gate_Pass' || reportType === 'Rental_Gate_Pass';

export const REPORT_SEND_N8N_WEBHOOK =
    'https://n8n.nicknameinfo.net/webhook/88ed0a9b-ee21-43e0-9684-f5c5859f9734';
export const GATE_PASS_SEND_N8N_WEBHOOK =
    'https://n8n.nicknameinfo.net/webhook/232a4cac-a830-4a4c-a848-dbf66d242d79';

export const getReportSendWebhook = (reportType) =>
    isGatePassReportType(reportType) ? GATE_PASS_SEND_N8N_WEBHOOK : REPORT_SEND_N8N_WEBHOOK;

export const getReportPageTitle = (reportType) =>
    isGatePassReportType(reportType) ? 'Gate Pass' : 'Reports';
