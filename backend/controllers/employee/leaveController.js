import EmployeeLeave from "../../models/employeeLeaveModel.js";
import Employee from "../../models/employeeModel.js";

// Create leave application (Employee)
export const createLeaveController = async (req, res) => {
    try {
        const userId = req.user._id;
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const {
            leaveType,
            leaveTypeOther,
            leaveFrom,
            leaveTo,
            totalDays,
            reason,
            contactDuringLeave,
        } = req.body;

        if (!leaveType || !leaveFrom || !leaveTo || !totalDays || !reason) {
            return res.status(400).send({
                success: false,
                message: "Leave type, from date, to date, total days and reason are required",
            });
        }

        const leave = new EmployeeLeave({
            employeeId: employee._id,
            userId,
            leaveType,
            leaveTypeOther: leaveType === "Other" ? leaveTypeOther : undefined,
            leaveFrom: new Date(leaveFrom),
            leaveTo: new Date(leaveTo),
            totalDays: Number(totalDays),
            reason,
            contactDuringLeave: contactDuringLeave || "",
        });

        await leave.save();

        res.status(201).send({
            success: true,
            message: "Leave application submitted successfully",
            leave,
        });
    } catch (error) {
        console.error("Error creating leave:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating leave application",
            error: error.message,
        });
    }
};

// Get my leave applications (Employee)
export const getMyLeavesController = async (req, res) => {
    try {
        const userId = req.user._id;
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let query = { employeeId: employee._id };
        if (status) query.status = status;

        const [leaves, totalCount] = await Promise.all([
            EmployeeLeave.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            EmployeeLeave.countDocuments(query),
        ]);

        res.status(200).send({
            success: true,
            leaves,
            totalCount,
        });
    } catch (error) {
        console.error("Error fetching leaves:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching leave applications",
            error: error.message,
        });
    }
};

// Get leave by ID (Employee - own only)
export const getLeaveByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const leave = await EmployeeLeave.findOne({
            _id: id,
            employeeId: employee._id,
        })
            .populate("employeeId", "name idCradNo department designation")
            .lean();

        if (!leave) {
            return res.status(404).send({
                success: false,
                message: "Leave application not found",
            });
        }

        res.status(200).send({
            success: true,
            leave,
        });
    } catch (error) {
        console.error("Error fetching leave:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching leave application",
            error: error.message,
        });
    }
};

// Update leave (Employee - own only, only if Pending)
export const updateLeaveController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const existing = await EmployeeLeave.findOne({
            _id: id,
            employeeId: employee._id,
        });
        if (!existing) {
            return res.status(404).send({
                success: false,
                message: "Leave application not found",
            });
        }
        if (existing.status !== "Pending") {
            return res.status(400).send({
                success: false,
                message: "Only pending leave applications can be updated",
            });
        }

        const {
            leaveType,
            leaveTypeOther,
            leaveFrom,
            leaveTo,
            totalDays,
            reason,
            contactDuringLeave,
        } = req.body;

        const leave = await EmployeeLeave.findOneAndUpdate(
            { _id: id, employeeId: employee._id },
            {
                ...(leaveType && { leaveType }),
                ...(leaveType !== undefined && leaveType === "Other" && { leaveTypeOther }),
                ...(leaveFrom && { leaveFrom: new Date(leaveFrom) }),
                ...(leaveTo && { leaveTo: new Date(leaveTo) }),
                ...(totalDays !== undefined && { totalDays: Number(totalDays) }),
                ...(reason && { reason }),
                ...(contactDuringLeave !== undefined && { contactDuringLeave }),
            },
            { new: true, runValidators: true }
        );

        res.status(200).send({
            success: true,
            message: "Leave application updated successfully",
            leave,
        });
    } catch (error) {
        console.error("Error updating leave:", error);
        res.status(500).send({
            success: false,
            message: "Error updating leave application",
            error: error.message,
        });
    }
};

// Delete leave (Employee - own only, only if Pending)
export const deleteLeaveController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const existing = await EmployeeLeave.findOne({
            _id: id,
            employeeId: employee._id,
        });
        if (!existing) {
            return res.status(404).send({
                success: false,
                message: "Leave application not found",
            });
        }
        if (existing.status !== "Pending") {
            return res.status(400).send({
                success: false,
                message: "Only pending leave applications can be deleted",
            });
        }

        await EmployeeLeave.findByIdAndDelete(id);

        res.status(200).send({
            success: true,
            message: "Leave application deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting leave:", error);
        res.status(500).send({
            success: false,
            message: "Error deleting leave application",
            error: error.message,
        });
    }
};

// Get all leave applications (Admin)
export const getAllLeavesController = async (req, res) => {
    try {
        const { page = 1, limit = 10, employeeId, fromDate, toDate, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let query = {};

        if (employeeId) query.employeeId = employeeId;
        if (status) query.status = status;
        if (fromDate) {
            const start = new Date(fromDate);
            start.setHours(0, 0, 0, 0);
            query.leaveFrom = query.leaveFrom || {};
            query.leaveFrom.$gte = start;
        }
        if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            query.leaveFrom = query.leaveFrom || {};
            query.leaveFrom.$lte = end;
        }

        const [leaves, totalCount] = await Promise.all([
            EmployeeLeave.find(query)
                .populate("employeeId", "name idCradNo phone email")
                .populate("userId", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            EmployeeLeave.countDocuments(query),
        ]);

        res.status(200).send({
            success: true,
            leaves,
            totalCount,
        });
    } catch (error) {
        console.error("Error fetching all leaves:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching leave applications",
            error: error.message,
        });
    }
};

// Update leave status (Admin)
export const updateLeaveStatusAdminController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, managerApproval, hrApproval, managerRemarks, hrRemarks } = req.body;

        const leave = await EmployeeLeave.findById(id);
        if (!leave) {
            return res.status(404).send({
                success: false,
                message: "Leave application not found",
            });
        }

        const update = {};
        if (status) update.status = status;
        if (managerApproval !== undefined) update.managerApproval = managerApproval;
        if (hrApproval !== undefined) update.hrApproval = hrApproval;
        if (managerRemarks !== undefined) update.managerRemarks = managerRemarks;
        if (hrRemarks !== undefined) update.hrRemarks = hrRemarks;

        const updated = await EmployeeLeave.findByIdAndUpdate(
            id,
            update,
            { new: true, runValidators: true }
        )
            .populate("employeeId", "name idCradNo phone email")
            .populate("userId", "name email");

        res.status(200).send({
            success: true,
            message: "Leave status updated successfully",
            leave: updated,
        });
    } catch (error) {
        console.error("Error updating leave status:", error);
        res.status(500).send({
            success: false,
            message: "Error updating leave status",
            error: error.message,
        });
    }
};
