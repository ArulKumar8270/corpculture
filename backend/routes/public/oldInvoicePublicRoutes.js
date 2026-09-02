import express from "express";
import {
    uploadOldInvoices,
    getAllOldInvoices,
    getOldInvoiceById,
    updateOldInvoice,
    deleteOldInvoice,
    deleteAllOldInvoices,
    getInvoicesByRemainderDate,
} from "../../controllers/invoice/oldInvoiceController.js";

const router = express.Router();

router.post("/upload", uploadOldInvoices);
router.get("/all", getAllOldInvoices);
router.get("/by-remainder-date", getInvoicesByRemainderDate);
router.get("/get/:id", getOldInvoiceById);
router.put("/update/:id", updateOldInvoice);
router.delete("/delete/:id", deleteOldInvoice);
router.delete("/delete-all", deleteAllOldInvoices);

export default router;
