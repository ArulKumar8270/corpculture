export const isCompanyBasedCommission = (commissionFrom) =>
  commissionFrom === 'Service' || commissionFrom === 'Rental';

export const getCommissionGroupKey = (commission, commissionFrom) => {
  if (isCompanyBasedCommission(commissionFrom)) {
    return (
      commission?.companyId?.companyName ||
      (typeof commission?.companyId === 'string' ? commission.companyId : null) ||
      'Unassigned'
    );
  }

  return commission?.userId?.name || commission?.userId || 'Unassigned';
};

export const getCommissionGroupLabel = (commissionFrom) =>
  isCompanyBasedCommission(commissionFrom) ? 'Company' : 'User';

export const formatCommissionAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const getCommissionRefId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object') return ref._id ? String(ref._id) : null;
  return String(ref);
};

export const getCommissionInvoiceNumber = (commission) => {
  const invoice =
    commission?.serviceInvoiceId ||
    commission?.rentalInvoiceId ||
    commission?.salesInvoiceId;
  if (invoice && typeof invoice === 'object' && invoice.invoiceNumber) {
    return String(invoice.invoiceNumber);
  }
  return getCommissionRefId(invoice);
};

export const getCommissionInvoiceLinkPath = (commission) => {
  if (commission?.serviceInvoiceId) {
    const id = getCommissionRefId(commission.serviceInvoiceId);
    return id ? `../addServiceInvoice/${id}` : null;
  }
  if (commission?.rentalInvoiceId) {
    const id = getCommissionRefId(commission.rentalInvoiceId);
    return id ? `../addRentalInvoice/${id}` : null;
  }
  return null;
};

export const getCommissionReferenceLabel = (commission) => {
  if (commission?.orderId) {
    const id = commission.orderId?._id || commission.orderId;
    return `Order ${String(id).slice(-6)}`;
  }
  if (commission?.serviceInvoiceId) {
    const number = getCommissionInvoiceNumber(commission);
    return number ? `Service Invoice ${number}` : 'Service Invoice';
  }
  if (commission?.rentalInvoiceId) {
    const number = getCommissionInvoiceNumber(commission);
    return number ? `Rental Invoice ${number}` : 'Rental Invoice';
  }
  if (commission?.salesInvoiceId) {
    const number = getCommissionInvoiceNumber(commission);
    return number ? `Sales Invoice ${number}` : 'Sales Invoice';
  }
  return '—';
};

export const getCommissionProductLabel = (commission) => {
  const serviceName =
    commission?.productId?.productName?.name ||
    commission?.productId?.sku ||
    null;
  if (serviceName) return serviceName;

  const rentalName =
    commission?.rentalProductId?.modelName ||
    commission?.rentalProductId?.serialNo ||
    null;
  if (rentalName) return rentalName;

  return commission?.companyId?.companyName || '—';
};
