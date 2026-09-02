import express from "express";
import { requireSignIn } from "../middleware/authMiddleware.js";
import employeeBenefitsPublicRoutes from "./public/employeeBenefitsPublicRoutes.js";
import { getMyEmployeeBenefits } from "../controllers/employee/employeeBenefitsController.js";

const router = express.Router();

router.get("/my", requireSignIn, getMyEmployeeBenefits);
router.use(employeeBenefitsPublicRoutes);

export default router;
