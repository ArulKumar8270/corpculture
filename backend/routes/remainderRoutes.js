import express from "express";
import {
    createRemainder,
    getAllRemainders,
    getRemainderById,
    getRemaindersByCompany,
    updateRemainder,
    deleteRemainder,
    getRemaindersByTodayDate,
} from "../controllers/remainder/remainderController.js";
// You might want to add authentication/authorization middleware here, e.g., isAdmin, requireSignIn
// import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new Remainder
router.post("/", createRemainder);

// Get all Remainders
router.get("/", getAllRemainders);

// Get remainders for a payload/IST date (before /:id so path is not captured)
router.get("/getByToday/remainder", getRemaindersByTodayDate);
router.post("/getByToday/remainder", getRemaindersByTodayDate);

// Get Remainder by ID
router.get("/:id", getRemainderById);

// Get Remainders by Company ID
router.get("/company/:companyId/:type", getRemaindersByCompany);

// Update Remainder
router.put("/:id", updateRemainder);

// Delete Remainder
router.delete("/:id", deleteRemainder);

export default router;