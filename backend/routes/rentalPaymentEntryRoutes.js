import express from 'express';
import {
    createRentalPaymentEntry,
    getSendDetailsToOptions,
    getAllRentalPaymentEntries,
    getRentalPaymentEntryById,
    updateRentalPaymentEntry,
    getRentalInvoiceAssignedTo // {{ edit_1 }}
} from '../controllers/rental/rentalPaymentEntryController.js';
import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Rental Payment Entry || POST
router.post('/create-rental-entry', isAdmin, createRentalPaymentEntry);

// Get all Rental Payment Entries || GET
router.get('/all/:invoiceType?', isAdmin, getAllRentalPaymentEntries);

// Get single Rental Payment Entry by ID || GET
router.get('/:id', isAdmin, getRentalPaymentEntryById);

// Update Rental Payment Entry || PUT // {{ edit_2 }}
router.put('/:id', isAdmin, updateRentalPaymentEntry); // {{ edit_2 }}

// Get single Rental invoice
router.get("/assignedTo/:assignedTo", getRentalInvoiceAssignedTo);

// Get send details to options || GET
router.get('/send-details-options', isAdmin, getSendDetailsToOptions);

export default router;