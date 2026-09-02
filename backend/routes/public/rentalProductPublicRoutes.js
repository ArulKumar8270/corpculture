import express from "express";
import {
    createRentalProduct,
    getAllRentalProducts,
    getRentalProductById,
    updateRentalProduct,
    deleteRentalProduct,
    getRentalProductsByCompany,
    getTodaysRentalProducts,
    normalizeExistingRentalPaymentDates,
} from "../../controllers/rentalProduct/rentalProductController.js";

const router = express.Router();

router.post("/", createRentalProduct);
router.get("/", getAllRentalProducts);
router.get("/getServiceProductsByCompany/:companyId", getRentalProductsByCompany);
router.get("/payment/today", getTodaysRentalProducts);
router.get("/:id", getRentalProductById);
router.post("/normalize-payment-dates", normalizeExistingRentalPaymentDates);
router.put("/:id", updateRentalProduct);
router.delete("/:id", deleteRentalProduct);

export default router;
