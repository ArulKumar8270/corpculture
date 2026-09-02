import express from "express";
import {
    createVendorProduct,
    getAllVendorProducts,
    getVendorProductById,
    updateVendorProduct,
    deleteVendorProduct,
    restoreVendorProduct,
    getProductsByVendorId,
} from "../../controllers/vendorProduct/vendorProductController.js";

const router = express.Router();

router.post("/", createVendorProduct);
router.get("/", getAllVendorProducts);
router.post("/restore/:id", restoreVendorProduct);
router.get("/getProductsByVendorId/:vendorId?", getProductsByVendorId);
router.get("/:id", getVendorProductById);
router.put("/:id", updateVendorProduct);
router.delete("/:id", deleteVendorProduct);

export default router;
