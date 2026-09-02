import express from "express";
import {
    createGst,
    getAllGst,
    getGstById,
    updateGst,
    deleteGst,
} from "../../controllers/gst/gstController.js";

const router = express.Router();

router.post("/", createGst);
router.get("/", getAllGst);
router.get("/:id", getGstById);
router.put("/:id", updateGst);
router.delete("/:id", deleteGst);

export default router;
