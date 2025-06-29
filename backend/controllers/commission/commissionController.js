import commissionModel from "../../models/commissionModel.js";

// Create Commission
export const createCommission = async (req, res) => {
    try {
        const commission = new commissionModel(req.body);
        await commission.save();

        res.status(201).send({
            success: true,
            message: "Commission created successfully",
            commission
        });
    } catch (error) {
        console.error("Error in creating commission:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating commission",
            error
        });
    }
};

// Get All Commissions
export const getAllCommissions = async (req, res) => {
    try {
        const commissions = await commissionModel.find({})
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
