import {
    autoAssignServiceEnquiryById,
    autoAssignRentalEnquiryById,
    notifyEmployeeOfEnquiryAssignment,
} from "./assignEnquiryToEmployee.js";

export const tryAutoAssignNewServiceEnquiry = async (service) => {
    if (!service?._id || service?.employeeId) return null;

    try {
        const result = await autoAssignServiceEnquiryById(service._id);
        if (result.success) {
            await notifyEmployeeOfEnquiryAssignment(
                result.employeeId,
                [result.enquiry],
                "service"
            );
        }
        return result;
    } catch (error) {
        console.error("Auto-assign service enquiry failed:", error);
        return null;
    }
};

export const tryAutoAssignNewRentalEnquiry = async (rental) => {
    if (!rental?._id || rental?.employeeId) return null;

    try {
        const result = await autoAssignRentalEnquiryById(rental._id);
        if (result.success) {
            await notifyEmployeeOfEnquiryAssignment(
                result.employeeId,
                [result.enquiry],
                "rental"
            );
        }
        return result;
    } catch (error) {
        console.error("Auto-assign rental enquiry failed:", error);
        return null;
    }
};
