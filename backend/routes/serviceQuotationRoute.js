import express from "express";
import { isAdminOrEmployee } from "../middleware/authMiddleware.js";
import serviceQuotationPublicRoutes from "./public/serviceQuotationPublicRoutes.js";
import {
    createServiceQuotation,
    getAllServiceQuotations,
    updateServiceQuotation,
    deleteServiceQuotation,
    restoreServiceQuotation,
} from "../controllers/serviceQuotation/serviceQuotationController.js";

const router = express.Router();

router.use(serviceQuotationPublicRoutes);

router.post("/create", isAdminOrEmployee, createServiceQuotation);
router.get("/all/:status?", isAdminOrEmployee, getAllServiceQuotations);
router.put("/update/:id", isAdminOrEmployee, updateServiceQuotation);
router.post("/restore/:id", isAdminOrEmployee, restoreServiceQuotation);
router.delete("/delete/:id", isAdminOrEmployee, deleteServiceQuotation);

export default router;
