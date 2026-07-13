import Employee from "../models/employeeModel.js";
import {
    hasEmployeeType,
    employeeMatchesOrderPincode,
} from "./orderEmployeeMatcher.js";
import { resolveEnquiryPincode } from "./resolveEnquiryPincode.js";

export const findMatchingEmployeesForEnquiry = (
    employees,
    pincode,
    employeeType
) => {
    return (employees || []).filter(
        (emp) =>
            hasEmployeeType(emp, employeeType) &&
            employeeMatchesOrderPincode(emp, pincode)
    );
};

export const findBestEmployeeForEnquiry = async (
    enquiry,
    employeeType,
    countModel,
    employees = null
) => {
    const pincode = await resolveEnquiryPincode(enquiry);
    if (!pincode) return null;

    const allEmployees =
        employees ?? (await Employee.find({}).select("-password").lean());

    const matches = findMatchingEmployeesForEnquiry(
        allEmployees,
        pincode,
        employeeType
    );

    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    const counts = await Promise.all(
        matches.map(async (emp) => ({
            emp,
            count: await countModel.countDocuments({
                employeeId: String(emp.userId),
                status: { $nin: ["Completed", "Cancelled"] },
            }),
        }))
    );

    counts.sort((a, b) => a.count - b.count);
    return counts[0].emp;
};
