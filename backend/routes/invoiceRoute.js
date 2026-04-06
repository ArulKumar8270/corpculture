import express from "express";
import { requireSignIn, isAdmin, isAdminOrEmployee } from "../middleware/authMiddleware.js";
import {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice
} from "../controllers/invoice/invoiceController.js";

const router = express.Router();

// Create invoice
router.post("/create", requireSignIn, isAdminOrEmployee, createInvoice);

// Get all invoices
router.get("/all", requireSignIn, isAdminOrEmployee, getAllInvoices);

// Get single invoice
router.get("/get/:id", requireSignIn, getInvoiceById);

// Update invoice
router.put("/update/:id", requireSignIn, isAdminOrEmployee, updateInvoice);

// Delete invoice
router.delete("/delete/:id", requireSignIn, isAdminOrEmployee, deleteInvoice);

export default router;