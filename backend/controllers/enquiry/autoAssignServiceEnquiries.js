import Employee from "../../models/employeeModel.js";
import {
    autoAssignServiceEnquiryById,
    notifyEmployeeOfEnquiryAssignment,
} from "../../utils/assignEnquiryToEmployee.js";

const autoAssignServiceEnquiries = async (req, res) => {
    try {
        const { serviceId } = req.body;

        if (!Array.isArray(serviceId) || serviceId.length === 0) {
            return res.status(400).send({
                success: false,
                message: "serviceId must be a non-empty array",
            });
        }

        const employees = await Employee.find({}).select("-password").lean();
        const assigned = [];
        const failed = [];
        const notificationsByEmployee = new Map();

        for (const id of serviceId) {
            try {
                const result = await autoAssignServiceEnquiryById(id, employees);

                if (result.success) {
                    assigned.push({
                        enquiryId: id,
                        employeeId: result.employeeId,
                        employeeName: result.employeeName,
                    });

                    const list = notificationsByEmployee.get(result.employeeId) || [];
                    list.push(result.enquiry);
                    notificationsByEmployee.set(result.employeeId, list);
                } else {
                    failed.push({
                        enquiryId: id,
                        reason: result.reason || "Assignment failed",
                    });
                }
            } catch (err) {
                failed.push({ enquiryId: id, reason: err.message });
            }
        }

        for (const [employeeUserId, enquiries] of notificationsByEmployee) {
            await notifyEmployeeOfEnquiryAssignment(
                employeeUserId,
                enquiries,
                "service"
            );
        }

        if (assigned.length > 0 && failed.length === 0) {
            return res.status(200).send({
                success: true,
                message: "All service enquiries auto-assigned successfully",
                assigned,
            });
        }

        if (assigned.length > 0) {
            return res.status(207).send({
                success: false,
                message: "Some service enquiries could not be auto-assigned",
                assigned,
                failed,
            });
        }

        return res.status(404).send({
            success: false,
            message: "No service enquiries could be auto-assigned",
            failed,
        });
    } catch (error) {
        console.error("Error in autoAssignServiceEnquiries:", error);
        return res.status(500).send({
            success: false,
            message: "Internal server error during auto assignment",
            error: error.message,
        });
    }
};

export default autoAssignServiceEnquiries;
