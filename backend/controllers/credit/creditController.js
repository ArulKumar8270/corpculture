import Credit from "../../models/creditModel.js";
import Company from "../../models/companyModel.js";
import mongoose from "mongoose";
import { softDeleteById, TRASH_SUCCESS_MESSAGE } from "../../utils/softDelete.js";
import {
    computeCompanyCreditSummary,
    userCanAccessCompany,
} from "../../utils/companyCreditUtil.js";

// Create Credit
export const createCredit = async (req, res) => {
    try {
        const { companyId, amount, description, creditType } = req.body;
        const createdBy = req.user._id;

        // Validate required fields
        if (!companyId || amount === undefined || amount === null) {
            return res.status(400).send({
                success: false,
                message: "Company ID and amount are required"
            });
        }

        // Validate amount
        if (isNaN(amount) || amount < 0) {
            return res.status(400).send({
                success: false,
                message: "Amount must be a positive number"
            });
        }

        // Check if company exists
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).send({
                success: false,
                message: "Company not found"
            });
        }

        // Create credit entry
        const credit = new Credit({
            companyId,
            amount: parseFloat(amount),
            description: description || '',
            creditType: creditType || 'Given',
            createdBy
        });

        await credit.save();

        res.status(201).send({
            success: true,
            message: "Credit added successfully",
            credit
        });
    } catch (error) {
        console.error("Error in creating credit:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating credit",
            error: error.message
        });
    }
};

// Get All Credits with pagination and filters
export const getAllCredits = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            companyId,
            creditType,
            fromDate,
            toDate
        } = req.query;

        let findQuery = {};

        // Filter by companyId
        if (companyId) {
            findQuery.companyId = companyId;
        }

        // Filter by creditType
        if (creditType) {
            findQuery.creditType = creditType;
        }

        // Filter by date range
        if (fromDate || toDate) {
            findQuery.createdAt = {};
            if (fromDate) {
                findQuery.createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                findQuery.createdAt.$lte = endOfDay;
            }
        }

        // Calculate skip for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const totalCount = await Credit.countDocuments(findQuery);

        // Fetch credits with pagination
        const credits = await Credit.find(findQuery)
            .populate('companyId', 'companyName billingAddress city state')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).send({
            success: true,
            credits,
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / parseInt(limit))
        });
    } catch (error) {
        console.error("Error in getting credits:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting credits",
            error: error.message
        });
    }
};

// Get Credit by ID
export const getCreditById = async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id)
            .populate('companyId', 'companyName billingAddress city state')
            .populate('createdBy', 'name email');

        if (!credit) {
            return res.status(404).send({
                success: false,
                message: "Credit not found"
            });
        }

        res.status(200).send({
            success: true,
            credit
        });
    } catch (error) {
        console.error("Error in getting credit:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting credit",
            error: error.message
        });
    }
};

// Get Credits by Company ID
export const getCreditsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const {
            page = 1,
            limit = 10
        } = req.query;

        // Calculate skip for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const totalCount = await Credit.countDocuments({ companyId });

        // Fetch credits for the company
        const credits = await Credit.find({ companyId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Calculate total credit amount for the company
        const summary = await computeCompanyCreditSummary(companyId);

        res.status(200).send({
            success: true,
            credits,
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            summary,
        });
    } catch (error) {
        console.error("Error in getting company credits:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting company credits",
            error: error.message
        });
    }
};

// Get available credit balance for logged-in user's company
export const getMyCompanyCreditBalance = async (req, res) => {
    try {
        const { companyId } = req.query;

        if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).send({
                success: false,
                message: "Valid company ID is required",
            });
        }

        const canAccess = await userCanAccessCompany(req.user, companyId);
        if (!canAccess) {
            return res.status(403).send({
                success: false,
                message: "You do not have access to this company's credit",
            });
        }

        const summary = await computeCompanyCreditSummary(companyId);

        res.status(200).send({
            success: true,
            companyId,
            summary,
        });
    } catch (error) {
        console.error("Error in getting company credit balance:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting company credit balance",
            error: error.message,
        });
    }
};

// Update Credit
export const updateCredit = async (req, res) => {
    try {
        const { amount, description, creditType } = req.body;
        const creditId = req.params.id;

        const credit = await Credit.findById(creditId);
        if (!credit) {
            return res.status(404).send({
                success: false,
                message: "Credit not found"
            });
        }

        // Update fields
        if (amount !== undefined) {
            if (isNaN(amount) || amount < 0) {
                return res.status(400).send({
                    success: false,
                    message: "Amount must be a positive number"
                });
            }
            credit.amount = parseFloat(amount);
        }

        if (description !== undefined) {
            credit.description = description;
        }

        if (creditType !== undefined) {
            credit.creditType = creditType;
        }

        await credit.save();

        res.status(200).send({
            success: true,
            message: "Credit updated successfully",
            credit
        });
    } catch (error) {
        console.error("Error in updating credit:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating credit",
            error: error.message
        });
    }
};

// Delete Credit
export const deleteCredit = async (req, res) => {
    try {
        const credit = await softDeleteById(Credit, req.params.id, req.user?._id);

        if (!credit) {
            return res.status(404).send({
                success: false,
                message: "Credit not found"
            });
        }

        res.status(200).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE
        });
    } catch (error) {
        console.error("Error in deleting credit:", error);
        res.status(500).send({
            success: false,
            message: "Error in deleting credit",
            error: error.message
        });
    }
};
