import express from "express";
import { isAdmin } from "../middleware/authMiddleware.js";
import {
    uploadOldInvoices,
    getAllOldInvoices,
    getOldInvoiceById,
    updateOldInvoice,
    deleteOldInvoice,
    deleteAllOldInvoices,
    getInvoicesByRemainderDate
} from "../controllers/invoice/oldInvoiceController.js";

const router = express.Router();

// Upload Excel file and import old invoices
router.post("/upload", uploadOldInvoices);

// Get all old invoices with pagination and filters
router.get("/all",  getAllOldInvoices);

// Get invoices by remainderDate (days)
router.get("/by-remainder-date", getInvoicesByRemainderDate);

// Get single old invoice by ID
router.get("/get/:id", getOldInvoiceById);

// Update old invoice
router.put("/update/:id", updateOldInvoice);

// Delete old invoice
router.delete("/delete/:id", deleteOldInvoice);

// Delete all old invoices (use with caution)
router.delete("/delete-all", deleteAllOldInvoices);

export default router;

