import EmployeeActivityLog from "../../models/employeeActivityLogModel.js";
import Company from "../../models/companyModel.js";
import Employee from "../../models/employeeModel.js";

// Create a new activity log
export const createActivityLogController = async (req, res) => {
    try {
        const {
            date,
            fromCompany,
            fromCompanyName,
            toCompany,
            toCompanyName,
            km,
            inTime,
            outTime,
            status,
            callType,
            assignedTo,
            remarks,
        } = req.body;

        const userId = req.user._id;

        // Find employee by userId
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        // Validate date
        if (!date) {
            return res.status(400).send({
                success: false,
                message: "Date is required",
            });
        }

        // Require existing company references (no company creation from this flow)
        if (!fromCompany) {
            return res.status(400).send({
                success: false,
                message: "From Company is required. Please select an existing company.",
            });
        }
        if (!toCompany) {
            return res.status(400).send({
                success: false,
                message: "To Company is required. Please select an existing company.",
            });
        }
        if (fromCompany === toCompany) {
            return res.status(400).send({
                success: false,
                message: "From Company and To Company cannot be the same",
            });
        }

        const fromCompanyExists = await Company.findById(fromCompany);
        if (!fromCompanyExists) {
            return res.status(404).send({
                success: false,
                message: "From Company not found",
            });
        }
        const toCompanyExists = await Company.findById(toCompany);
        if (!toCompanyExists) {
            return res.status(404).send({
                success: false,
                message: "To Company not found",
            });
        }

        const activityLog = new EmployeeActivityLog({
            employeeId: employee._id,
            userId,
            date,
            fromCompany,
            fromCompanyName: fromCompanyName || fromCompanyExists.companyName || null,
            toCompany,
            toCompanyName: toCompanyName || toCompanyExists.companyName || null,
            km: km || 0,
            inTime: inTime || null,
            outTime: outTime || null,
            status: status === "PAID" || status === "UNPAID" ? status : undefined,
            callType: callType || null,
            assignedTo: assignedTo || null,
            remarks: remarks || null,
        });

        await activityLog.save();

        res.status(201).send({
            success: true,
            message: "Activity log created successfully",
            activityLog,
        });
    } catch (error) {
        console.error("Error creating activity log:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating activity log",
            error: error.message,
        });
    }
};

// Get all activity logs for the logged-in employee
export const getActivityLogsController = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find employee by userId
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const { page = 1, limit = 10, fromDate, toDate } = req.query;

        let query = { employeeId: employee._id };

        // Filter by date range if provided
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) {
                query.date.$gte = new Date(fromDate);
            }
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.date.$lte = endOfDay;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const activityLogs = await EmployeeActivityLog.find(query)
            .populate("fromCompany", "companyName")
            .populate("toCompany", "companyName")
            .populate("assignedTo", "name email")
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await EmployeeActivityLog.countDocuments(query);

        res.status(200).send({
            success: true,
            message: "Activity logs fetched successfully",
            activityLogs,
            totalCount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
        });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).send({
            success: false,
            message: "Error in fetching activity logs",
            error: error.message,
        });
    }
};

// Get activity log by ID
export const getActivityLogByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find employee by userId
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const activityLog = await EmployeeActivityLog.findOne({
            _id: id,
            employeeId: employee._id,
        })
            .populate("fromCompany", "companyName")
            .populate("toCompany", "companyName")
            .populate("assignedTo", "name email");

        if (!activityLog) {
            return res.status(404).send({
                success: false,
                message: "Activity log not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Activity log fetched successfully",
            activityLog,
        });
    } catch (error) {
        console.error("Error fetching activity log:", error);
        res.status(500).send({
            success: false,
            message: "Error in fetching activity log",
            error: error.message,
        });
    }
};

// Update activity log
export const updateActivityLogController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find employee by userId
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const {
            date,
            fromCompany,
            fromCompanyName,
            toCompany,
            toCompanyName,
            km,
            inTime,
            outTime,
            callType,
            assignedTo,
            remarks,
        } = req.body;

        // Validate company references if provided (must be existing companies; no creation from this flow)
        if (fromCompany && toCompany && fromCompany === toCompany) {
            return res.status(400).send({
                success: false,
                message: "From Company and To Company cannot be the same",
            });
        }
        if (fromCompany) {
            const fromCompanyExists = await Company.findById(fromCompany);
            if (!fromCompanyExists) {
                return res.status(404).send({
                    success: false,
                    message: "From Company not found",
                });
            }
        }
        if (toCompany) {
            const toCompanyExists = await Company.findById(toCompany);
            if (!toCompanyExists) {
                return res.status(404).send({
                    success: false,
                    message: "To Company not found",
                });
            }
        }

        const activityLog = await EmployeeActivityLog.findOneAndUpdate(
            { _id: id, employeeId: employee._id },
            {
                date,
                fromCompany: fromCompany || null,
                fromCompanyName: fromCompanyName || null,
                toCompany: toCompany || null,
                toCompanyName: toCompanyName || null,
                km: km || 0,
                inTime: inTime || null,
                outTime: outTime || null,
                callType: callType || null,
                assignedTo: assignedTo || null,
                remarks: remarks || null,
            },
            { new: true, runValidators: true }
        )
            .populate("fromCompany", "companyName")
            .populate("toCompany", "companyName")
            .populate("assignedTo", "name email");

        if (!activityLog) {
            return res.status(404).send({
                success: false,
                message: "Activity log not found or you don't have permission to update it",
            });
        }

        res.status(200).send({
            success: true,
            message: "Activity log updated successfully",
            activityLog,
        });
    } catch (error) {
        console.error("Error updating activity log:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating activity log",
            error: error.message,
        });
    }
};

// Delete activity log
export const deleteActivityLogController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Find employee by userId
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }

        const activityLog = await EmployeeActivityLog.findOneAndDelete({
            _id: id,
            employeeId: employee._id,
        });

        if (!activityLog) {
            return res.status(404).send({
                success: false,
                message: "Activity log not found or you don't have permission to delete it",
            });
        }

        res.status(200).send({
            success: true,
            message: "Activity log deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting activity log:", error);
        res.status(500).send({
            success: false,
            message: "Error in deleting activity log",
            error: error.message,
        });
    }
};

// Get all activity logs (Admin only)
export const getAllActivityLogsController = async (req, res) => {
    try {
        const { page = 1, limit = 10, employeeId, fromDate, toDate, status } = req.query;

        let query = {};

        if (employeeId) {
            query.employeeId = employeeId;
        }

        // Filter by date range if provided
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) {
                query.date.$gte = new Date(fromDate);
            }
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.date.$lte = endOfDay;
            }
        }

        // Filter by payment status if provided
        if (status && (status === "PAID" || status === "UNPAID")) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const activityLogs = await EmployeeActivityLog.find(query)
            .populate("employeeId", "name email")
            .populate("userId", "name email")
            .populate("fromCompany", "companyName")
            .populate("toCompany", "companyName")
            .populate("assignedTo", "name email")
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await EmployeeActivityLog.countDocuments(query);

        res.status(200).send({
            success: true,
            message: "Activity logs fetched successfully",
            activityLogs,
            totalCount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
        });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).send({
            success: false,
            message: "Error in fetching activity logs",
            error: error.message,
        });
    }
};

// Update activity log status (Admin only)
export const updateActivityLogStatusAdminController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== "PAID" && status !== "UNPAID") {
            return res.status(400).send({
                success: false,
                message: "Invalid status. Allowed: PAID, UNPAID",
            });
        }

        const activityLog = await EmployeeActivityLog.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        )
            .populate("employeeId", "name email")
            .populate("userId", "name email")
            .populate("fromCompany", "companyName")
            .populate("toCompany", "companyName")
            .populate("assignedTo", "name email");

        if (!activityLog) {
            return res.status(404).send({
                success: false,
                message: "Activity log not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Status updated successfully",
            activityLog,
        });
    } catch (error) {
        console.error("Error updating activity log status:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating activity log status",
            error: error.message,
        });
    }
};

