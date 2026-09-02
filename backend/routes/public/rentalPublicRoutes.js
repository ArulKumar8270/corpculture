import express from "express";
import {
    createrRental,
    getRentalByType,
    getRentalAssignedTo,
} from "../../controllers/rental/rentalController.js";

const router = express.Router();

router.post("/create", createrRental);
router.get("/serviceType/:serviceType", getRentalByType);
router.get("/assignedTo/:assignedTo", getRentalAssignedTo);
router.get("/phone/:phone", getRentalByType);

export default router;
