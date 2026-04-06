import express from "express";
import { isAdmin, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import {
    createServiceInvoice,
    getAllServiceInvoices,
    getServiceInvoiceById,
    updateServiceInvoice,
    deleteServiceInvoice,
    getServiceInvoicesAssignedTo
} from "../controllers/serviceInvoice/serviceInvoiceController.js";

const router = express.Router();

// Create service invoice (employees assigned to service work can create)
router.post("/create", isAdminOrEmployee, createServiceInvoice);

// Get all service invoices
router.post("/all", getAllServiceInvoices);

// Get single service invoice
router.get("/get/:id", getServiceInvoiceById);

// Get single service invoice
router.post("/assignedTo/:assignedTo?/:invoiceType", getServiceInvoicesAssignedTo);

// Update service invoice
router.put("/update/:id", isAdminOrEmployee, updateServiceInvoice);

// Delete service invoice
router.delete("/delete/:id", isAdminOrEmployee, deleteServiceInvoice);

export default router;