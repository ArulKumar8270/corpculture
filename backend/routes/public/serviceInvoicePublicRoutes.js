import express from "express";
import {
    getAllServiceInvoices,
    getServiceInvoiceById,
    getServiceInvoicesAssignedTo,
} from "../../controllers/serviceInvoice/serviceInvoiceController.js";

const router = express.Router();

router.post("/all", getAllServiceInvoices);
router.get("/get/:id", getServiceInvoiceById);
router.post("/assignedTo/:assignedTo?/:invoiceType", getServiceInvoicesAssignedTo);

export default router;
