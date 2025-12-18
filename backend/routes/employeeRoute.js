import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js"; // Assuming middleware path
import {
    createEmployeeController,
    getAllEmployeesController,
    getSingleEmployeeController,
    getEmployeeByUserIdController,
    updateEmployeeController,
    deleteEmployeeController
} from '../controllers/employee/employeeController.js';

const router = express.Router();

// Create Employee || POST
// Assuming only admin can create employees
router.post("/create", isAdmin, createEmployeeController);

// Get All Employees || GET
// Assuming only admin can view all employees
router.get("/all", isAdmin, getAllEmployeesController);

// Get Single Employee || GET
// Assuming only signed-in users (or admin) can view a single employee
router.get("/get/:id", getSingleEmployeeController);

// Get Employee by User ID || GET
// For users to get their own employee data
router.get("/user/:userId", requireSignIn, getEmployeeByUserIdController);

// Update Employee || PUT
// Assuming only admin can update employees
router.put("/update/:id", isAdmin, updateEmployeeController);

// Delete Employee || DELETE
// Assuming only admin can delete employees
router.delete("/delete/:id", isAdmin, deleteEmployeeController);

export default router;