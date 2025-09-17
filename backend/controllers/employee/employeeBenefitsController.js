import EmployeeBenefits from "../../models/employeeBenefitsModel.js";

// Create Employee Benefit
export const createEmployeeBenefit = async (req, res) => {
    try {
        const { employeeId, invoiceId, productId, quantity, reInstall, otherProducts } = req.body;
        if (!employeeId || !invoiceId || !productId) {
            return res.status(400).send({ success: false, message: "Missing required fields" });
        }
        const benefit = new EmployeeBenefits({
            employeeId,
            invoiceId,
            productId,
            quantity,
            reInstall,
            otherProducts,
        });
        await benefit.save();
        res.status(201).send({ success: true, message: "Employee benefit created", benefit });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error creating employee benefit", error });
    }
};

// Get All Employee Benefits
export const getAllEmployeeBenefits = async (req, res) => {
    try {
        const benefits = await EmployeeBenefits.find()
            .populate("employeeId")
            .populate("invoiceId")
            .populate("productId");
        res.status(200).send({ success: true, benefits });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error fetching employee benefits", error });
    }
};

// Get Employee Benefit by ID
export const getEmployeeBenefitById = async (req, res) => {
    try {
        const { id } = req.params;
        const benefit = await EmployeeBenefits.findById(id)
            .populate("employeeId")
            .populate("invoiceId")
            .populate("productId");
        if (!benefit) {
            return res.status(404).send({ success: false, message: "Employee benefit not found" });
        }
        res.status(200).send({ success: true, benefit });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error fetching employee benefit", error });
    }
};

// Update Employee Benefit
export const updateEmployeeBenefit = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await EmployeeBenefits.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).send({ success: false, message: "Employee benefit not found" });
        }
        res.status(200).send({ success: true, message: "Employee benefit updated", benefit: updated });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error updating employee benefit", error });
    }
};

// Delete Employee Benefit
export const deleteEmployeeBenefit = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await EmployeeBenefits.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).send({ success: false, message: "Employee benefit not found" });
        }
        res.status(200).send({ success: true, message: "Employee benefit deleted" });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error deleting employee benefit", error });
    }
};