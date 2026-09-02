import express from "express";
import { isAdminOrEmployee, requireSignIn } from "../middleware/authMiddleware.js";
import employeePublicRoutes from "./public/employeePublicRoutes.js";
import {
    createEmployeeController,
    getAllEmployeesController,
    getEmployeeByUserIdController,
    updateEmployeeController,
    deleteEmployeeController,
} from "../controllers/employee/employeeController.js";

const router = express.Router();

router.use(employeePublicRoutes);

router.post("/create", isAdminOrEmployee, createEmployeeController);
router.get("/all", isAdminOrEmployee, getAllEmployeesController);
router.get("/user/:userId", requireSignIn, getEmployeeByUserIdController);
router.put("/update/:id", isAdminOrEmployee, updateEmployeeController);
router.delete("/delete/:id", isAdminOrEmployee, deleteEmployeeController);

export default router;
