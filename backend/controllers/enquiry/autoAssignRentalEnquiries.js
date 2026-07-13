import Employee from "../../models/employeeModel.js";
import {
    autoAssignRentalEnquiryById,
    notifyEmployeeOfEnquiryAssignment,
} from "../../utils/assignEnquiryToEmployee.js";

const autoAssignRentalEnquiries = async (req, res) => {
    try {
        const { rentalId } = req.body;

        if (!Array.isArray(rentalId) || rentalId.length === 0) {
            return res.status(400).send({
                success: false,
                message: "rentalId must be a non-empty array",
            });
        }

        const employees = await Employee.find({}).select("-password").lean();
        const assigned = [];
        const failed = [];
        const notificationsByEmployee = new Map();

        for (const id of rentalId) {
            try {
                const result = await autoAssignRentalEnquiryById(id, employees);

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
                "rental"
            );
        }

        if (assigned.length > 0 && failed.length === 0) {
            return res.status(200).send({
                success: true,
                message: "All rental enquiries auto-assigned successfully",
                assigned,
            });
        }

        if (assigned.length > 0) {
            return res.status(207).send({
                success: false,
                message: "Some rental enquiries could not be auto-assigned",
                assigned,
                failed,
            });
        }

        return res.status(404).send({
            success: false,
            message: "No rental enquiries could be auto-assigned",
            failed,
        });
    } catch (error) {
        console.error("Error in autoAssignRentalEnquiries:", error);
        return res.status(500).send({
            success: false,
            message: "Internal server error during auto assignment",
            error: error.message,
        });
    }
};

export default autoAssignRentalEnquiries;
