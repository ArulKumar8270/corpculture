import express from "express";
import { isAdmin, isAdminOrEmployee } from "../middleware/authMiddleware.js";
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
router.post("/create", isAdminOrEmployee, createServiceQuotation);

// Get all service Quotations
router.get("/all/:status?", isAdminOrEmployee, getAllServiceQuotations);

// Get single service Quotation
router.get("/get/:id", getServiceQuotationById);

// Update service Quotation
router.put("/update/:id", isAdminOrEmployee, updateServiceQuotation);

// Get single service Quotation
router.get("/assignedTo/:assignedTo", getServiceQuotationAssignedTo);

// Delete service Quotation
router.delete("/delete/:id", isAdminOrEmployee, deleteServiceQuotation);

export default router;