import Employee from "../../models/employeeModel.js";
import bcrypt from "bcryptjs"; // Assuming you use bcrypt for password hashing

// Create a new employee
export const createEmployeeController = async (req, res) => {
    try {
        const { name, email, password, phone, address, employeeType, userId } = req.body;

        // Validation
        if (!name || !email || !password || !phone || !address || !employeeType || !userId) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
            });
        }

        // Check if employee already exists
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(409).send({
                success: false,
                message: "Employee with this email already exists",
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new employee
        const employee = new Employee({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            employeeType,
            userId
        });

        await employee.save();

        // Exclude password from response
        employee.password = undefined;

        res.status(201).send({
            success: true,
            message: "Employee created successfully",
            employee,
        });

    } catch (error) {
        console.error("Error in createEmployeeController:", error);
        res.status(500).send({
            success: false,
            message: "Error creating employee",
            error,
        });
    }
};

// Get all employees
export const getAllEmployeesController = async (req, res) => {
    try {
        const employees = await Employee.find({}).select("-password"); // Exclude passwords
        res.status(200).send({
            success: true,
            message: "All employees fetched successfully",
            count: employees.length,
            employees,
        });
    } catch (error) {
        console.error("Error in getAllEmployeesController:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching employees",
            error,
        });
    }
};

// Get a single employee by ID
export const getSingleEmployeeController = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).select("-password"); // Exclude password
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found",
            });
        }
        res.status(200).send({
            success: true,
            message: "Single employee fetched successfully",
            employee,
        });
    } catch (error) {
        console.error("Error in getSingleEmployeeController:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching employee",
            error,
        });
    }
};

// Update an employee by ID
export const updateEmployeeController = async (req, res) => {
    try {
        const { name, email, phone, address, employeeType } = req.body;
        const employeeId = req.params.id;

        // Find the employee
        let employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found",
            });
        }

        // Update fields
        employee.name = name || employee.name;
        employee.email = email || employee.email;
        employee.phone = phone || employee.phone;
        employee.address = address || employee.address;
        employee.employeeType = employeeType || employee.employeeType;

        // Note: Password update should ideally be handled in a separate route for security

        await employee.save();

        // Exclude password from response
        employee.password = undefined;

        res.status(200).send({
            success: true,
            message: "Employee updated successfully",
            employee,
        });

    } catch (error) {
        console.error("Error in updateEmployeeController:", error);
        res.status(500).send({
            success: false,
            message: "Error updating employee",
            error,
        });
    }
};

// Delete an employee by ID
export const deleteEmployeeController = async (req, res) => {
    try {
        const employeeId = req.params.id;

        const employee = await Employee.findByIdAndDelete(employeeId);

        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Employee deleted successfully",
        });

    } catch (error) {
        console.error("Error in deleteEmployeeController:", error);
        res.status(500).send({
            success: false,
            message: "Error deleting employee",
            error,
        });
    }
};