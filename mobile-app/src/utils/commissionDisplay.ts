type CommissionFrom = 'Sales' | 'Service' | 'Rental';

export const isCompanyBasedCommission = (commissionFrom: CommissionFrom | string) =>
  commissionFrom === 'Service' || commissionFrom === 'Rental';

export const getCommissionGroupKey = (commission: any, commissionFrom: CommissionFrom | string) => {
  if (isCompanyBasedCommission(commissionFrom)) {
    return (
      commission?.companyId?.companyName ||
      (typeof commission?.companyId === 'string' ? commission.companyId : null) ||
      'Unassigned'
    );
  }

  const userId = commission?.userId;
  if (typeof userId === 'object') {
    return userId?.name || 'Unassigned';
  }
  return userId || 'Unassigned';
};

export const getCommissionGroupLabel = (commissionFrom: CommissionFrom | string) =>
  isCompanyBasedCommission(commissionFrom) ? 'Company' : 'User';

export const formatCommissionAmount = (amount: unknown) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const getCommissionReferenceLabel = (commission: any) => {
  if (commission?.orderId) {
    const id = commission.orderId?._id || commission.orderId;
    return `Order ${String(id).slice(-6)}`;
  }
  if (commission?.serviceInvoiceId) {
    const id = commission.serviceInvoiceId?._id || commission.serviceInvoiceId;
    return `Service Invoice ${String(id).slice(-6)}`;
  }
  if (commission?.rentalInvoiceId) {
    const id = commission.rentalInvoiceId?._id || commission.rentalInvoiceId;
    return `Rental Invoice ${String(id).slice(-6)}`;
  }
  if (commission?.salesInvoiceId) {
    const id = commission.salesInvoiceId?._id || commission.salesInvoiceId;
    return `Sales Invoice ${String(id).slice(-6)}`;
  }
  return '—';
};

export const getCommissionProductLabel = (commission: any) => {
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
