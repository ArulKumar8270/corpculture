export const hasEmployeeType = (employee: any, type: string) => {
  if (!employee?.employeeType) return false;
  const et = employee.employeeType;
  return Array.isArray(et) ? et.includes(type) : et === type;
};

export const normalizePincode = (pincode: unknown) => {
  if (pincode == null || pincode === '') return '';
  return String(pincode).trim();
};

export const employeeMatchesOrder = (employee: any, order: any) => {
  if (!hasEmployeeType(employee, 'Sales')) return false;

  const pin = normalizePincode(order?.shippingInfo?.pincode);
  const employeePincodes = (Array.isArray(employee?.pincode)
    ? employee.pincode
    : employee?.pincode
      ? [employee.pincode]
      : []
  )
    .map(normalizePincode)
    .filter(Boolean);

  if (!pin || employeePincodes.length === 0 || !employeePincodes.includes(pin)) {
    return false;
  }

  const amount = Number(order?.amount) || 0;
  const priceFrom = Number(employee?.orderPriceFrom);
  const priceTo = Number(employee?.orderPriceTo);
  const hasFrom = Number.isFinite(priceFrom) && priceFrom > 0;
  const hasTo = Number.isFinite(priceTo) && priceTo > 0;

  if (!hasFrom && !hasTo) return true;
  if (hasFrom && amount < priceFrom) return false;
  if (hasTo && amount > priceTo) return false;
  return true;
};

export const getSuggestedEmployee = (order: any, salesEmployees: any[]) => {
  const matches = (salesEmployees || []).filter((emp) =>
    employeeMatchesOrder(emp, order)
  );
  return matches[0] || null;
};

export const isOrderAssigned = (order: any) =>
  !!(order?.employeeId?._id || order?.employeeId);
