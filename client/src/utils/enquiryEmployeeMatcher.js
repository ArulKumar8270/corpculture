export const normalizePincode = (pincode) => {
    if (pincode == null || pincode === "") return "";
    return String(pincode).trim();
};

export const hasEmployeeType = (employee, type) => {
    if (!employee?.employeeType) return false;
    const et = employee.employeeType;
    return Array.isArray(et) ? et.includes(type) : et === type;
};

export const employeeMatchesEnquiryPincode = (employee, pincode) => {
    const pin = normalizePincode(pincode);
    if (!pin) return false;

    const employeePincodes = (employee?.pincode || [])
        .map(normalizePincode)
        .filter(Boolean);

    if (employeePincodes.length === 0) return false;
    return employeePincodes.includes(pin);
};

export const getSuggestedEnquiryEmployee = (enquiry, employees, employeeType) => {
    const pin = normalizePincode(enquiry?.pincode);
    if (!pin) return null;

    const matches = (employees || []).filter(
        (emp) =>
            hasEmployeeType(emp, employeeType) &&
            employeeMatchesEnquiryPincode(emp, pin)
    );

    return matches[0] || null;
};

export const isEnquiryAssigned = (enquiry) => !!enquiry?.employeeId;
