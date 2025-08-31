import express from "express";
import { isAdmin } from "../middleware/authMiddleware.js";
import {
    createServiceInvoice,
    getAllServiceInvoices,
    getServiceInvoiceById,
    updateServiceInvoice,
    deleteServiceInvoice,
    getServiceInvoicesAssignedTo
} from "../controllers/serviceInvoice/serviceInvoiceController.js";

const router = express.Router();

// Create service invoice
router.post("/create", isAdmin, createServiceInvoice);

// Get all service invoices
router.post("/all", isAdmin, getAllServiceInvoices);

// Get single service invoice
router.get("/get/:id", getServiceInvoiceById);

// Get single service invoice
router.post("/assignedTo/:assignedTo?/:invoiceType", getServiceInvoicesAssignedTo);

// Update service invoice
router.put("/update/:id", isAdmin, updateServiceInvoice);

// Delete service invoice
router.delete("/delete/:id", isAdmin, deleteServiceInvoice);

export default router;