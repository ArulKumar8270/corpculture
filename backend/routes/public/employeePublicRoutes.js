import express from "express";
import { getSingleEmployeeController } from "../../controllers/employee/employeeController.js";

const router = express.Router();

router.get("/get/:id", getSingleEmployeeController);

export default router;
