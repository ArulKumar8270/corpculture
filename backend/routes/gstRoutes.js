import express from "express";
import {
    createGst,
    getAllGst,
    getGstById,
    updateGst,
    deleteGst,
} from "../controllers/gst/gstController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new GST Type
router.post("/", createGst); // Consider adding isAdmin middleware here

// Get all GST Types
router.get("/", getAllGst);

// Get GST Type by ID
router.get("/:id", getGstById);

// Update GST Type
router.put("/:id", updateGst); // Consider adding isAdmin middleware here

// Delete GST Type
router.delete("/:id", deleteGst); // Consider adding isAdmin middleware here

export default router;