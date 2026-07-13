export const formatCommissionAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const getCommissionReferenceLabel = (commission) => {
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
