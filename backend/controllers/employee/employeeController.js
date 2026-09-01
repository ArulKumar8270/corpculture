import Employee from "../../models/employeeModel.js";
import bcrypt from "bcryptjs"; // Assuming you use bcrypt for password hashing
import { softDeleteById, TRASH_SUCCESS_MESSAGE } from "../../utils/softDelete.js";

// Create a new employee
export const createEmployeeController = async (req, res) => {
    try {
        const { name, email, password, phone, address, pincode, employeeType, userId, designation, idCradNo, department, salary, bikeAllowance, image, parentName, parentPhone, parentAddress, parentRelation, idProof, orderPriceFrom, orderPriceTo } = req.body;

        // Validation
        const isValidEmployeeType = Array.isArray(employeeType) ? employeeType.length > 0 : employeeType;
        if (!name || !email || !password || !phone || !address || !isValidEmployeeType || !userId) {
            return res.status(400).send({
                success: false,
                message: "All required fields are missing",
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
            pincode,
            employeeType,
            userId,
            designation, // Added
            idCradNo,    // Added
            department,  // Added
            salary,      // Added
            bikeAllowance,
            image,       // Added
            parentName,  // Added
            parentPhone, // Added
            parentAddress, // Added
            parentRelation, // Added
            idProof,     // Added
            orderPriceFrom: orderPriceFrom !== undefined ? Number(orderPriceFrom) : 0,
            orderPriceTo: orderPriceTo !== undefined ? Number(orderPriceTo) : 0,
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

const normalizeEmployeeMoneyFields = (doc) => {
    if (!doc || typeof doc !== "object") return doc;
    const salary = Number(doc.salary);
    const bikeAllowance = Number(doc.bikeAllowance);
    return {
        ...doc,
        salary: Number.isFinite(salary) ? salary : 0,
        bikeAllowance: Number.isFinite(bikeAllowance) ? bikeAllowance : 0,
    };
};

// Get all employees
export const getAllEmployeesController = async (req, res) => {
    try {
        const employees = await Employee.find({}).populate('department').select("-password").lean();
        const normalized = employees.map((e) => normalizeEmployeeMoneyFields(e));
        res.status(200).send({
            success: true,
            message: "All employees fetched successfully",
            count: normalized.length,
            employees: normalized,
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
        const employee = await Employee.findById(req.params.id).select("-password").populate("department").lean();
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found",
            });
        }
        res.status(200).send({
            success: true,
            message: "Single employee fetched successfully",
            employee: normalizeEmployeeMoneyFields(employee),
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

// Get employee by userId
export const getEmployeeByUserIdController = async (req, res) => {
    try {
        const userId = req.params.userId;
        const employee = await Employee.findOne({ userId }).select("-password").populate("department"); // Exclude password
        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found for this user",
            });
        }
        res.status(200).send({
            success: true,
            message: "Employee fetched successfully",
            employee,
        });
    } catch (error) {
        console.error("Error in getEmployeeByUserIdController:", error);
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
        const { name, email, phone, address, pincode, employeeType, designation, idCradNo, department, salary, bikeAllowance, image, parentName, parentPhone, parentAddress, parentRelation, idProof, orderPriceFrom, orderPriceTo } = req.body;
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
        employee.pincode = pincode !== undefined ? pincode : employee.pincode;
        employee.employeeType = employeeType !== undefined ? employeeType : employee.employeeType;
        employee.designation = designation !== undefined ? designation : employee.designation; // Added
        employee.idCradNo = idCradNo !== undefined ? idCradNo : employee.idCradNo;       // Added
        employee.department = department !== undefined ? department : employee.department; // Added
        employee.salary = salary !== undefined ? salary : employee.salary;             // Added
        employee.bikeAllowance = bikeAllowance !== undefined ? bikeAllowance : employee.bikeAllowance;
        employee.image = image !== undefined ? image : employee.image;                 // Added
        employee.parentName = parentName !== undefined ? parentName : employee.parentName; // Added
        employee.parentPhone = parentPhone !== undefined ? parentPhone : employee.parentPhone; // Added
        employee.parentAddress = parentAddress !== undefined ? parentAddress : employee.parentAddress; // Added
        employee.parentRelation = parentRelation !== undefined ? parentRelation : employee.parentRelation; // Added
        employee.idProof = idProof !== undefined ? idProof : employee.idProof; // Added
        employee.orderPriceFrom = orderPriceFrom !== undefined ? Number(orderPriceFrom) : employee.orderPriceFrom;
        employee.orderPriceTo = orderPriceTo !== undefined ? Number(orderPriceTo) : employee.orderPriceTo;

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

        const employee = await softDeleteById(Employee, employeeId, req.user?._id);

        if (!employee) {
            return res.status(404).send({
                success: false,
                message: "Employee not found",
            });
        }

        res.status(200).send({
            success: true,
            message: TRASH_SUCCESS_MESSAGE,
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