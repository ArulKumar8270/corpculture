import express from "express";
import { isAdminOrEmployee } from "../middleware/authMiddleware.js";
import serviceInvoicePublicRoutes from "./public/serviceInvoicePublicRoutes.js";
import {
    createServiceInvoice,
    updateServiceInvoice,
    deleteServiceInvoice,
    restoreServiceInvoice,
} from "../controllers/serviceInvoice/serviceInvoiceController.js";

const router = express.Router();

router.use(serviceInvoicePublicRoutes);

router.post("/create", isAdminOrEmployee, createServiceInvoice);
router.put("/update/:id", isAdminOrEmployee, updateServiceInvoice);
router.post("/restore/:id", isAdminOrEmployee, restoreServiceInvoice);
router.delete("/delete/:id", isAdminOrEmployee, deleteServiceInvoice);

export default router;
