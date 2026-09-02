import express from "express";
import { isAdminOrEmployee, requireSignIn } from "../middleware/authMiddleware.js";
import rentalPublicRoutes from "./public/rentalPublicRoutes.js";
import {
    getAllRental,
    getRentalById,
    updateRental,
    deleteRental,
} from "../controllers/rental/rentalController.js";
import autoAssignRentalEnquiries from "../controllers/enquiry/autoAssignRentalEnquiries.js";

const router = express.Router();

router.use(rentalPublicRoutes);

router.get("/all", isAdminOrEmployee, getAllRental);
router.get("/get/:id", requireSignIn, getRentalById);
router.put("/update/:id", isAdminOrEmployee, updateRental);
router.patch("/auto-assign", isAdminOrEmployee, autoAssignRentalEnquiries);
router.delete("/delete/:id", isAdminOrEmployee, deleteRental);

export default router;
