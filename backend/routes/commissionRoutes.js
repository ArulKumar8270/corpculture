import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import {
  createCommission,
  getAllCommissions,
  getCommissionById,
  updateCommission,
  deleteCommission,
  getCommissionsByUser,
  getMyCommissions,
} from "../controllers/commission/commissionController.js";

const router = express.Router();

// Create new commission
router.post("/", createCommission);

// Get all commissions (admin / partners list)
router.get("/", getAllCommissions);

// Logged-in user's commissions (customer profile)
router.get("/me", requireSignIn, getMyCommissions);

// Get commissions by user ID
router.get("/user/:id", requireSignIn, getCommissionsByUser);

// Get commission by ID
router.get("/:id", getCommissionById);

// Update commission
router.put("/:id", updateCommission);

// Delete commission
router.delete("/:id", deleteCommission);

export default router;
