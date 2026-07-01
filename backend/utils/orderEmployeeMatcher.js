import Employee from "../models/employeeModel.js";
import orderModel from "../models/orderModel.js";

export const hasEmployeeType = (employee, type) => {
    if (!employee?.employeeType) return false;
    const et = employee.employeeType;
    return Array.isArray(et) ? et.includes(type) : et === type;
};

export const normalizePincode = (pincode) => {
    if (pincode == null || pincode === "") return "";
    return String(pincode).trim();
};

/** True when order amount falls within the employee's configured price range (0 = no limit on that side). */
export const employeeMatchesOrderPrice = (employee, orderAmount) => {
    const amount = Number(orderAmount) || 0;
    const priceFrom = Number(employee?.orderPriceFrom);
    const priceTo = Number(employee?.orderPriceTo);

    const hasFrom = Number.isFinite(priceFrom) && priceFrom > 0;
    const hasTo = Number.isFinite(priceTo) && priceTo > 0;

    if (!hasFrom && !hasTo) return true;
    if (hasFrom && amount < priceFrom) return false;
    if (hasTo && amount > priceTo) return false;
    return true;
};

export const employeeMatchesOrderPincode = (employee, orderPincode) => {
    const pin = normalizePincode(orderPincode);
    if (!pin) return false;

    const employeePincodes = (employee?.pincode || [])
        .map(normalizePincode)
        .filter(Boolean);

    if (employeePincodes.length === 0) return false;
    return employeePincodes.includes(pin);
};

export const employeeMatchesOrder = (employee, orderAmount, orderPincode) => {
    if (!hasEmployeeType(employee, "Sales")) return false;
    if (!employeeMatchesOrderPincode(employee, orderPincode)) return false;
    return employeeMatchesOrderPrice(employee, orderAmount);
};

export const findMatchingSalesEmployees = (employees, orderAmount, orderPincode) => {
    return (employees || []).filter((emp) =>
        employeeMatchesOrder(emp, orderAmount, orderPincode)
    );
};

export const findBestEmployeeForOrder = async (order, employees = null) => {
    const orderPincode = order?.shippingInfo?.pincode;
    const orderAmount = order?.amount ?? 0;

    const salesEmployees =
        employees ??
        (await Employee.find({}).select("-password").lean());

    const allSales = (salesEmployees || []).filter((emp) =>
        hasEmployeeType(emp, "Sales")
    );

    const matches = findMatchingSalesEmployees(
        allSales,
        orderAmount,
        orderPincode
    );

    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    const counts = await Promise.all(
        matches.map(async (emp) => ({
            emp,
            count: await orderModel.countDocuments({
                employeeId: emp._id,
                orderStatus: { $nin: ["Cancelled", "Delivered"] },
            }),
        }))
    );

    counts.sort((a, b) => a.count - b.count);
    return counts[0].emp;
};
