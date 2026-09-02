import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import commissionPublicRoutes from "./public/commissionPublicRoutes.js";
import { getMyCommissions } from "../controllers/commission/commissionController.js";

const router = express.Router();

router.get("/me", requireSignIn, getMyCommissions);
router.use(commissionPublicRoutes);

export default router;
