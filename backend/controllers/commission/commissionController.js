import commissionModel from "../../models/commissionModel.js";
import { softDeleteById, TRASH_SUCCESS_MESSAGE } from "../../utils/softDelete.js";

const buildCommissionSummary = (commissions = []) => {
    const totalEarned = commissions.reduce(
        (sum, c) => sum + (Number(c.commissionAmount) || 0),
        0
    );
    const totalPaid = commissions
        .filter((c) => c.isPaid)
        .reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0);
    const totalPending = totalEarned - totalPaid;

    const byType = commissions.reduce((acc, c) => {
        const key = c.commissionFrom || "Other";
        if (!acc[key]) {
            acc[key] = { count: 0, amount: 0 };
        }
        acc[key].count += 1;
        acc[key].amount += Number(c.commissionAmount) || 0;
        return acc;
    }, {});

    return {
        totalEarned,
        totalPaid,
        totalPending,
        count: commissions.length,
        byType,
    };
};

// Create Commission
export const createCommission = async (req, res) => {
    try {
        const { rentalInvoiceId, serviceInvoiceId, salesInvoiceId, productId, rentalProductId } = req.body;

        let result;
        if (rentalInvoiceId || serviceInvoiceId || salesInvoiceId) {
            let query = {};
            if (rentalInvoiceId && rentalProductId) {
                query = { rentalInvoiceId, rentalProductId };
            } else if (rentalInvoiceId) {
                query = { rentalInvoiceId };
            } else if (serviceInvoiceId && productId) {
                query = { serviceInvoiceId, productId };
            } else if (serviceInvoiceId) {
                query = { serviceInvoiceId };
            } else if (salesInvoiceId) {
                query = { salesInvoiceId };
            }

            // Find and update the commission, or create if it doesn't exist
            result = await commissionModel.findOneAndUpdate(
                query,
                req.body, // The entire req.body contains all fields to update/set
                {
                    new: true, // Return the updated document
                    upsert: true, // Create a new document if no match is found
                    setDefaultsOnInsert: true, // Apply schema defaults if a new document is inserted
                    rawResult: true // Return the raw result from MongoDB driver to check for upserted status
                }
            );
        } else {
            // If no specific invoice ID is provided, create a new commission record
            result = await commissionModel.create(req.body);
        }

        if (!result) {
            return res.status(500).send({
                success: false,
                message: "Failed to create or update commission."
            });
        }

        const commission = result.value || result;
        const isNew = result.lastErrorObject?.upserted !== undefined;

        res.status(isNew ? 201 : 200).send({
            success: true,
            message: isNew ? "Commission created successfully." : "Commission updated successfully.",
            commission,
        });
    } catch (error) {
        console.error("Error in creating/updating commission:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating/updating commission",
            error
        });
    }
};

// Get All Commissions
export const getAllCommissions = async (req, res) => {
    try {
        const commissionFrom = req.query.commissionFrom || "Sales";
        const commissions = await commissionModel.find({commissionFrom})
            .populate("userId")
            .populate("companyId")
            .populate({
                path: "productId",
                select: "sku commission productName",
                populate: { path: "productName", select: "name" },
            })
            .populate({
                path: "rentalProductId",
                select: "modelName serialNo commission",
            })
            .sort({ createdAt: -1 });

        res.status(200).send({
            success: true,
            commissions
        });
    } catch (error) {
        console.error("Error in getting commissions:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting commissions",
            error
        });
    }
};

// Get Single Commission by ID
export const getCommissionById = async (req, res) => {
    try {
        const commissionId = req.params.id;
        const commission = await commissionModel.findById(commissionId)
        if (!commission) {
            return res.status(404).send({
                success: false,
                message: "Commission not found",
                errorType: "commissionNotFound"
            });
        }

        res.status(200).send({
            success: true,
            commission
        });
    } catch (error) {
        console.error("Error in getting commission:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting commission",
            error
        });
    }
};

// Update Commission
export const updateCommission = async (req, res) => {
    try {
        const commissionId = req.params.id;
        const existing = await commissionModel.findById(commissionId);

        if (!existing) {
            return res.status(404).send({
                success: false,
                message: "Commission not found",
                errorType: "commissionNotFound"
            });
        }

        const updated = await commissionModel.findByIdAndUpdate(
            commissionId,
            req.body,
            { new: true }
        );

        res.status(200).send({
            success: true,
            message: "Commission updated successfully",
            commission: updated
        });
    } catch (error) {
        console.error("Error in updating commission:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating commission",
            error
        });
    }
};

// Delete Commission
export const deleteCommission = async (req, res) => {
    try {
        const commissionId = req.params.id;
        const existing = await commissionModel.findById(commissionId);

        if (!existing) {
            return res.status(404).send({
                success: false,
                message: "Commission not found",
                errorType: "commissionNotFound"
            });
        }

        await softDeleteById(commissionModel, commissionId, req.user?._id);

        res.status(200).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE
        });
    } catch (error) {
        console.error("Error in deleting commission:", error);
        res.status(500).send({
            success: false,
            message: "Error in deleting commission",
            error
        });
    }
};

// Get commissions for the logged-in user (customer profile)
export const getMyCommissions = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).send({
                success: false,
                message: "Unauthorized",
            });
        }

        const commissions = await commissionModel
            .find({ userId })
            .populate("companyId", "companyName")
            .populate({
                path: "productId",
                select: "sku commission productName",
                populate: { path: "productName", select: "name" },
            })
            .populate({
                path: "rentalProductId",
                select: "modelName serialNo commission",
            })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).send({
            success: true,
            commissions,
            summary: buildCommissionSummary(commissions),
        });
    } catch (error) {
        console.error("Error in getting my commissions:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting commissions",
            error: error.message,
        });
    }
};

// Get Commission by User ID
export const getCommissionsByUser = async (req, res) => {
    try {
        const requestedUserId = req.params.id;
        const authUserId = String(req.user?._id || "");
        const isAdmin = Number(req.user?.role) === 1;

        if (!isAdmin && authUserId !== String(requestedUserId)) {
            return res.status(403).send({
                success: false,
                message: "You can only view your own commissions",
            });
        }

        const commissions = await commissionModel
            .find({ userId: requestedUserId })
            .populate("companyId", "companyName")
            .populate({
                path: "productId",
                select: "sku commission productName",
                populate: { path: "productName", select: "name" },
            })
            .populate({
                path: "rentalProductId",
                select: "modelName serialNo commission",
            })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).send({
            success: true,
            message: "Commissions fetched successfully",
            commissions,
            summary: buildCommissionSummary(commissions),
        });
    } catch (error) {
        console.error("Error in getting user commissions:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting user commissions",
            error: error.message,
        });
    }
};
