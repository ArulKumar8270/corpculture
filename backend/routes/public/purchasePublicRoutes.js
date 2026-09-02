import express from "express";
import {
    createPurchase,
    bulkCreatePurchases,
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    restorePurchase,
} from "../../controllers/purchase/purchaseController.js";

const router = express.Router();

router.post("/", createPurchase);
router.post("/bulk", bulkCreatePurchases);
router.get("/", getAllPurchases);
router.post("/restore/:id", restorePurchase);
router.get("/:id", getPurchaseById);
router.put("/:id", updatePurchase);
router.delete("/:id", deletePurchase);

export default router;
