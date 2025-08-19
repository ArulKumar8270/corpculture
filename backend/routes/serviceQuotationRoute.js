import express from "express";
import { isAdmin } from "../middleware/authMiddleware.js";
import {
    createServiceQuotation,
    getAllServiceQuotations,
    getServiceQuotationById,
    updateServiceQuotation,
    deleteServiceQuotation,
    getServiceQuotationAssignedTo
} from "../controllers/serviceQuotation/serviceQuotationController.js";

const router = express.Router();

// Create service Quotation
router.post("/create", isAdmin, createServiceQuotation);

// Get all service Quotations
router.get("/all/:status", isAdmin, getAllServiceQuotations);

// Get single service Quotation
router.get("/get/:id", getServiceQuotationById);

// Update service Quotation
router.put("/update/:id", isAdmin, updateServiceQuotation);

// Get single service Quotation
router.get("/assignedTo/:assignedTo", getServiceQuotationAssignedTo);

// Delete service Quotation
router.delete("/delete/:id", isAdmin, deleteServiceQuotation);

export default router;