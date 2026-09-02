import express from "express";
import {
    createMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial,
    updateOrCreateMaterial,
} from "../../controllers/material/materialController.js";

const router = express.Router();

router.post("/", createMaterial);
router.get("/", getAllMaterials);
router.get("/:name", getMaterialById);
router.post("/updateMaterial/:name", updateMaterial);
router.post("/update-or-create", updateOrCreateMaterial);
router.delete("/:id", deleteMaterial);

export default router;
