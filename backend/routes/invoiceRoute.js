import express from "express";
import { requireSignIn, isAdmin } from "../middleware/authMiddleware.js";
import {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice
} from "../controllers/invoice/invoiceController.js";

const router = express.Router();

// Create invoice
router.post("/create", requireSignIn, isAdmin, createInvoice);

// Get all invoices
router.get("/all", requireSignIn, isAdmin, getAllInvoices);

// Get single invoice
router.get("/get/:id", requireSignIn, getInvoiceById);

// Update invoice
router.put("/update/:id", requireSignIn, isAdmin, updateInvoice);

// Delete invoice
router.delete("/delete/:id", requireSignIn, isAdmin, deleteInvoice);

export default router;