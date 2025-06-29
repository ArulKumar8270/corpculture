import express from "express";
import {
  createCommission,
  getAllCommissions,
  getCommissionById,
  updateCommission,
  deleteCommission,
  getCommissionsByUser
} from "../controllers/commission/commissionController.js";

const router = express.Router();

// Create new commission
router.post("/", createCommission);

// Get all commissions
router.get("/", getAllCommissions);

// Get commission by ID
router.get("/:id", getCommissionById);

// Update commission
router.put("/:id", updateCommission);

// Delete commission
router.delete("/:id", deleteCommission);

// Get commissions by user ID
router.get("/user/:id", getCommissionsByUser);

export default router;
