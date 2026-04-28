import EmployeeActivityLog from "../../models/employeeActivityLogModel.js";
import Company from "../../models/companyModel.js";
import Employee from "../../models/employeeModel.js";
import CommonDetails from "../../models/commonDetailsModel.js";

async function computePetrolAmount(km) {
    const n = Number(km);
    if (!Number.isFinite(n) || n <= 0) return 0;
    const common = await CommonDetails.findOne({})
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    const price = Number(common?.petrolPricePerKm || 0);
    if (!Number.isFinite(price) || price <= 0) return 0;
    return n * price;
}

async function getLatestPetrolPricePerKm() {
    const common = await CommonDetails.findOne({})
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    const price = Number(common?.petrolPricePerKm || 0);
    return Number.isFinite(price) && price > 0 ? price : 0;
}

function computePetrolAmountWithPrice(km, pricePerKm) {
    const n = Number(km);
    const p = Number(pricePerKm);
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (!Number.isFinite(p) || p <= 0) return 0;
    return n * p;
}

// Create a new activity log
export const createActivityLogController = async (req, res) => {
    try {
        const {
            date,
            fromCompany,
            fromCompanyName,
            fromAddressLine,
            fromPincode,
            toCompany,
            toCompanyName,
            toAddressLine,
            toPincode,
            km,
            inTime,
            outTime,
            petrolAmount: petrolAmountFromClient,
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
            fromAddressLine: fromAddressLine || null,
            fromPincode: fromPincode || null,
            toCompany,
            toCompanyName: toCompanyName || toCompanyExists.companyName || null,
            toAddressLine: toAddressLine || null,
            toPincode: toPincode || null,
            km: km || 0,
            petrolAmount:
                Number.isFinite(Number(petrolAmountFromClient)) && Number(petrolAmountFromClient) >= 0
                    ? Number(petrolAmountFromClient)
                    : await computePetrolAmount(km),
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
            .limit(parseInt(limit))
            .lean();

        // Backfill petrolAmount for old records missing it
        const pricePerKm = await getLatestPetrolPricePerKm();
        const ops = [];
        for (const log of activityLogs) {
            if (log?.petrolAmount == null) {
                const petrolAmount = computePetrolAmountWithPrice(log?.km, pricePerKm);
                log.petrolAmount = petrolAmount;
                ops.push({
                    updateOne: {
                        filter: { _id: log._id },
                        update: { $set: { petrolAmount } },
                    },
                });
            }
        }
        if (ops.length) {
            await EmployeeActivityLog.bulkWrite(ops, { ordered: false });
        }

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
            .populate("assignedTo", "name email")
            .lean();

        if (!activityLog) {
            return res.status(404).send({
                success: false,
                message: "Activity log not found",
            });
        }

        // Backfill petrolAmount for old records missing it
        if (activityLog?.petrolAmount == null) {
            const pricePerKm = await getLatestPetrolPricePerKm();
            const petrolAmount = computePetrolAmountWithPrice(activityLog?.km, pricePerKm);
            activityLog.petrolAmount = petrolAmount;
            await EmployeeActivityLog.updateOne(
                { _id: activityLog._id },
                { $set: { petrolAmount } }
            );
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
            fromAddressLine,
            fromPincode,
            toCompany,
            toCompanyName,
            toAddressLine,
            toPincode,
            km,
            inTime,
            outTime,
            callType,
            assignedTo,
            remarks,
            petrolAmount: petrolAmountFromClient,
        } = req.body;

        // Validate company references if provided (must be existing companies; no creation from this flow)
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

        const petrolAmount =
            Number.isFinite(Number(petrolAmountFromClient)) && Number(petrolAmountFromClient) >= 0
                ? Number(petrolAmountFromClient)
                : await computePetrolAmount(km);
        const activityLog = await EmployeeActivityLog.findOneAndUpdate(
            { _id: id, employeeId: employee._id },
            {
                date,
                fromCompany: fromCompany || null,
                fromCompanyName: fromCompanyName || null,
                fromAddressLine: fromAddressLine || null,
                fromPincode: fromPincode || null,
                toCompany: toCompany || null,
                toCompanyName: toCompanyName || null,
                toAddressLine: toAddressLine || null,
                toPincode: toPincode || null,
                km: km || 0,
                petrolAmount,
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

// Get Activity Log by ID (Admin only)
export const getActivityLogByIdAdminController = async (req, res) => {
    try {
        const { id } = req.params;

        const activityLog = await EmployeeActivityLog.findById(id)
            .populate("employeeId", "name email")
            .populate("userId", "name email")
            .populate("fromCompany", "companyName")
            .populate("toCompany", "companyName")
            .populate("assignedTo", "name email")
            .lean();

        if (!activityLog) {
            return res.status(404).send({
                success: false,
                message: "Activity log not found",
            });
        }

        // Backfill petrolAmount for old records missing it
        if (activityLog?.petrolAmount == null) {
            const pricePerKm = await getLatestPetrolPricePerKm();
            const petrolAmount = computePetrolAmountWithPrice(activityLog?.km, pricePerKm);
            activityLog.petrolAmount = petrolAmount;
            await EmployeeActivityLog.updateOne(
                { _id: activityLog._id },
                { $set: { petrolAmount } }
            );
        }

        return res.status(200).send({
            success: true,
            message: "Activity log fetched successfully",
            activityLog,
        });
    } catch (error) {
        console.error("Error fetching activity log (admin):", error);
        return res.status(500).send({
            success: false,
            message: "Error in fetching activity log",
            error: error.message,
        });
    }
};

// Update Activity Log (Admin only)
export const updateActivityLogAdminController = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            date,
            fromCompany,
            fromCompanyName,
            fromAddressLine,
            fromPincode,
            toCompany,
            toCompanyName,
            toAddressLine,
            toPincode,
            km,
            inTime,
            outTime,
            callType,
            assignedTo,
            remarks,
            status,
            petrolAmount: petrolAmountFromClient,
        } = req.body;

        // Validate company references if provided
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

        const petrolAmount =
            Number.isFinite(Number(petrolAmountFromClient)) && Number(petrolAmountFromClient) >= 0
                ? Number(petrolAmountFromClient)
                : await computePetrolAmount(km);
        const activityLog = await EmployeeActivityLog.findByIdAndUpdate(
            id,
            {
                date,
                fromCompany: fromCompany || null,
                fromCompanyName: fromCompanyName || null,
                fromAddressLine: fromAddressLine || null,
                fromPincode: fromPincode || null,
                toCompany: toCompany || null,
                toCompanyName: toCompanyName || null,
                toAddressLine: toAddressLine || null,
                toPincode: toPincode || null,
                km: km || 0,
                petrolAmount,
                inTime: inTime || null,
                outTime: outTime || null,
                callType: callType || null,
                assignedTo: assignedTo || null,
                remarks: remarks || null,
                ...(status ? { status } : {}),
            },
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

        return res.status(200).send({
            success: true,
            message: "Activity log updated successfully",
            activityLog,
        });
    } catch (error) {
        console.error("Error updating activity log (admin):", error);
        return res.status(500).send({
            success: false,
            message: "Error in updating activity log",
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
            .limit(parseInt(limit))
            .lean();

        // Backfill petrolAmount for old records missing it (so reports show amount)
        const pricePerKm = await getLatestPetrolPricePerKm();
        const ops = [];
        for (const log of activityLogs) {
            if (log?.petrolAmount == null) {
                const petrolAmount = computePetrolAmountWithPrice(log?.km, pricePerKm);
                log.petrolAmount = petrolAmount;
                ops.push({
                    updateOne: {
                        filter: { _id: log._id },
                        update: { $set: { petrolAmount } },
                    },
                });
            }
        }
        if (ops.length) {
            await EmployeeActivityLog.bulkWrite(ops, { ordered: false });
        }

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

