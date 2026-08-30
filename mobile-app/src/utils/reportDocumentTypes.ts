export const CONTENT_SCOPE_OPTIONS = ['Service', 'Product', 'Service + Product'] as const;

export const SERVICE_GATE_PASS = 'Service_Gate_Pass';
export const RENTAL_GATE_PASS = 'Rental_Gate_Pass';
export const SERVICE_DELIVERY_CHALLAN = 'Service_Delivery_Challan';
export const RENTAL_DELIVERY_CHALLAN = 'Rental_Delivery_Challan';
export const SERVICE_RETURNABLE_CHALLAN = 'Service_Returnable_Challan';
export const RENTAL_RETURNABLE_CHALLAN = 'Rental_Returnable_Challan';

export const SERVICE_DOCUMENT_TYPES = [
  SERVICE_GATE_PASS,
  SERVICE_DELIVERY_CHALLAN,
  SERVICE_RETURNABLE_CHALLAN,
];

export const RENTAL_DOCUMENT_TYPES = [
  RENTAL_GATE_PASS,
  RENTAL_DELIVERY_CHALLAN,
  RENTAL_RETURNABLE_CHALLAN,
];

export const OPERATIONAL_DOCUMENT_TYPES = [
  ...SERVICE_DOCUMENT_TYPES,
  ...RENTAL_DOCUMENT_TYPES,
];

const DOCUMENT_META: Record<string, { title: string; listScreen: string; permissionKey: string }> = {
  Service_Report: { title: 'Service Report', listScreen: 'ServiceReports', permissionKey: 'serviceReport' },
  Rental_Report: { title: 'Rental Report', listScreen: 'RentalReports', permissionKey: 'rentalReport' },
  [SERVICE_GATE_PASS]: { title: 'Gate Pass', listScreen: 'ServiceGatePass', permissionKey: 'serviceGatePass' },
  [SERVICE_DELIVERY_CHALLAN]: {
    title: 'Delivery Challan (DC Copy)',
    listScreen: 'ServiceDeliveryChallan',
    permissionKey: 'serviceDeliveryChallan',
  },
  [SERVICE_RETURNABLE_CHALLAN]: {
    title: 'Returnable Challan',
    listScreen: 'ServiceReturnableChallan',
    permissionKey: 'serviceReturnableChallan',
  },
  [RENTAL_GATE_PASS]: { title: 'Gate Pass', listScreen: 'RentalGatePass', permissionKey: 'rentalGatePass' },
  [RENTAL_DELIVERY_CHALLAN]: {
    title: 'Delivery Challan (DC Copy)',
    listScreen: 'RentalDeliveryChallan',
    permissionKey: 'rentalDeliveryChallan',
  },
  [RENTAL_RETURNABLE_CHALLAN]: {
    title: 'Returnable Challan',
    listScreen: 'RentalReturnableChallan',
    permissionKey: 'rentalReturnableChallan',
  },
};

export const isGatePassReportType = (reportType?: string) =>
  reportType === SERVICE_GATE_PASS || reportType === RENTAL_GATE_PASS;

export const isDeliveryChallanReportType = (reportType?: string) =>
  reportType === SERVICE_DELIVERY_CHALLAN || reportType === RENTAL_DELIVERY_CHALLAN;

export const isReturnableChallanReportType = (reportType?: string) =>
  reportType === SERVICE_RETURNABLE_CHALLAN || reportType === RENTAL_RETURNABLE_CHALLAN;

export const isOperationalDocumentReportType = (reportType?: string) =>
  !!reportType && OPERATIONAL_DOCUMENT_TYPES.includes(reportType);

export const isContentScopeRequired = (_reportType?: string) => false;

export const showsContentScopeField = (_reportType?: string) => true;

export const getDocumentTitle = (reportType?: string) =>
  (reportType && DOCUMENT_META[reportType]?.title) || 'Report';

export const getDocumentListScreen = (reportType?: string) =>
  (reportType && DOCUMENT_META[reportType]?.listScreen) || 'ServiceReports';

export const getDocumentPermissionKey = (reportType?: string) =>
  (reportType && DOCUMENT_META[reportType]?.permissionKey) ||
  (reportType?.startsWith('Rental_') ? 'rentalReport' : 'serviceReport');

export const isRentalReportDomain = (reportType?: string) =>
  !!reportType && reportType.startsWith('Rental_');

export const getDocumentSuccessMessage = (
  reportType?: string,
  action: 'submitted' | 'updated' | 'sent' = 'submitted'
) => {
  const title = getDocumentTitle(reportType);
  if (action === 'updated') return `${title} updated successfully`;
  if (action === 'sent') return `${title} sent successfully`;
  return `${title} submitted successfully`;
};

export const getDocumentFormTitle = (reportType?: string, isEdit = false) => {
  const title = getDocumentTitle(reportType);
  const prefix = isEdit ? 'Edit' : 'Add';
  if (title === 'Report') {
    return isEdit ? 'Edit Report' : 'Add Report';
  }
  return `${prefix} ${title}`;
};

export const isValidContentScope = (value?: string) =>
  CONTENT_SCOPE_OPTIONS.includes(String(value || '').trim() as (typeof CONTENT_SCOPE_OPTIONS)[number]);
