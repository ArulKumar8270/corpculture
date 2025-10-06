import commissionModel from "../../models/commissionModel.js";

// Create Commission
export const createCommission = async (req, res) => {
    try {
        const { rentalInvoiceId, serviceInvoiceId, salesInvoiceId } = req.body;

        let result;
        if (rentalInvoiceId || serviceInvoiceId || salesInvoiceId) {
            let query = {};
            if (rentalInvoiceId) {
                query = { rentalInvoiceId };
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
        const commissions = await commissionModel.find().populate("userId")
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

        await commissionModel.findByIdAndDelete(commissionId);

        res.status(200).send({
            success: true,
            message: "Commission deleted successfully"
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

// Get Commission by User ID
export const getCommissionsByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const commissions = await commissionModel.find({ userId })
            .sort({ createdAt: -1 });

        if (!commissions || commissions.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No commissions found for this user",
                errorType: "commissionNotFound"
            });
        }

        res.status(200).send({
            success: true,
            message: "Commissions fetched successfully",
            commissions
        });
    } catch (error) {
        console.error("Error in getting user commissions:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting user commissions",
            error
        });
    }
};
