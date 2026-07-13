export const normalizePincode = (pincode: unknown) => {
  if (pincode == null || pincode === '') return '';
  return String(pincode).trim();
};

export const hasEmployeeType = (employee: any, type: string) => {
  if (!employee?.employeeType) return false;
  const et = employee.employeeType;
  return Array.isArray(et) ? et.includes(type) : et === type;
};

export const employeeMatchesEnquiryPincode = (employee: any, pincode: unknown) => {
  const pin = normalizePincode(pincode);
  if (!pin) return false;

  const employeePincodes = (Array.isArray(employee?.pincode)
    ? employee.pincode
    : employee?.pincode
      ? [employee.pincode]
      : []
  )
    .map(normalizePincode)
    .filter(Boolean);

  if (employeePincodes.length === 0) return false;
  return employeePincodes.includes(pin);
};

export const getSuggestedEnquiryEmployee = (
  enquiry: any,
  employees: any[],
  employeeType: string
) => {
  const pin = normalizePincode(enquiry?.pincode);
  if (!pin) return null;

  const matches = (employees || []).filter(
    (emp) =>
      hasEmployeeType(emp, employeeType) &&
      employeeMatchesEnquiryPincode(emp, pin)
  );

  return matches[0] || null;
};

export const isEnquiryAssigned = (enquiry: any) => !!enquiry?.employeeId;
