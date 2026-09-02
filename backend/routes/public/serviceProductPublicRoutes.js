import express from "express";
import {
    createServiceProduct,
    getAllServiceProducts,
    getServiceProductById,
    updateServiceProduct,
    deleteServiceProduct,
    restoreServiceProduct,
    getServiceProductsByCompany,
} from "../../controllers/serviceProduct/serviceProductController.js";

const router = express.Router();

router.post("/", createServiceProduct);
router.get("/", getAllServiceProducts);
router.post("/restore/:id", restoreServiceProduct);
router.get("/getServiceProductsByCompany/:companyId", getServiceProductsByCompany);
router.get("/:id", getServiceProductById);
router.put("/:id", updateServiceProduct);
router.delete("/:id", deleteServiceProduct);

export default router;
