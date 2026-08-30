import {
    getDocumentMeta,
    getDocumentTitle,
    isGatePassReportType,
    isOperationalDocumentReportType,
    SERVICE_DELIVERY_CHALLAN,
    SERVICE_GATE_PASS,
    SERVICE_RETURNABLE_CHALLAN,
    RENTAL_DELIVERY_CHALLAN,
    RENTAL_GATE_PASS,
    RENTAL_RETURNABLE_CHALLAN,
} from './reportDocumentTypes';

/** List page paths keyed by reportType */
export const getReportListPath = (reportType) => {
    const meta = getDocumentMeta(reportType);
    if (meta?.listPath) return meta.listPath;
    switch (reportType) {
        case 'Rental_Report':
            return '../rentalReportlist';
        case 'Service_Report':
        default:
            return '../serviceReportlist';
    }
};

/** Add/edit form path (no id) keyed by reportType */
export const getReportFormPath = (reportType) => {
    const meta = getDocumentMeta(reportType);
    if (meta?.formPath) return meta.formPath;
    switch (reportType) {
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

export { isGatePassReportType, isOperationalDocumentReportType };

export const REPORT_SEND_N8N_WEBHOOK =
    'https://n8n.nicknameinfo.net/webhook/88ed0a9b-ee21-43e0-9684-f5c5859f9734';
export const GATE_PASS_SEND_N8N_WEBHOOK =
    'https://n8n.nicknameinfo.net/webhook/232a4cac-a830-4a4c-a848-dbf66d242d79';

export const getReportSendWebhook = (reportType) =>
    isOperationalDocumentReportType(reportType) ? GATE_PASS_SEND_N8N_WEBHOOK : REPORT_SEND_N8N_WEBHOOK;

export const getPayloadReportFor = (reportType) =>
    isOperationalDocumentReportType(reportType) ? reportType : (String(reportType || '').startsWith('Rental_') ? 'rental' : 'service');

export const getReportPageTitle = (reportType) => {
    if (isOperationalDocumentReportType(reportType)) {
        return getDocumentTitle(reportType);
    }
    return 'Reports';
};

export const REPORT_TYPE_LABELS = {
    Service_Report: 'Service Report',
    Rental_Report: 'Rental Report',
    [SERVICE_GATE_PASS]: 'Gate Pass',
    [RENTAL_GATE_PASS]: 'Gate Pass',
    [SERVICE_DELIVERY_CHALLAN]: 'Delivery Challan (DC Copy)',
    [RENTAL_DELIVERY_CHALLAN]: 'Delivery Challan (DC Copy)',
    [SERVICE_RETURNABLE_CHALLAN]: 'Returnable Challan',
    [RENTAL_RETURNABLE_CHALLAN]: 'Returnable Challan',
};
