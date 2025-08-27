import companyModel from "../../models/companyModel.js";

// Create Company
export const createCompany = async (req, res) => {
    try {
        const company = new companyModel(req.body);
        await company.save();

        res.status(201).send({
            success: true,
            message: "Company request created successfully",
            company
        });
    } catch (error) {
        console.error("Error in company creation:", error);
        res.status(500).send({
            success: false,
            message: "Error in company creation",
            error
        });
    }
};

// Get All Companies
export const getAllCompanies = async (req, res) => {
    try {
        const companies = await companyModel.find({}).sort({ createdAt: -1 });
        res.status(200).send({
            success: true,
            companies
        });
    } catch (error) {
        console.error("Error in getting companies:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting companies",
            error
        });
    }
};

// Get Single Companie
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await companyModel.findById(companyId);

        if (!company) {
            return res.status(404).send({
                success: false,
                message: "company not found",
                errorType: "companyNotFound"
            });
        }

        res.status(200).send({
            success: true,
            company
        });
    } catch (error) {
        console.error("Error in getting company:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting company",
            error
        });
    }
};

// Update company
export const updateCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await companyModel.findById(companyId);

        if (!company) {
            return res.status(404).send({
                success: false,
                message: "company not found",
                errorType: "companyNotFound"
            });
        }

        const updatedcompany = await companyModel.findByIdAndUpdate(
            companyId,
            req.body,
            { new: true }
        );

        res.status(200).send({
            success: true,
            message: "company updated successfully",
            company: updatedcompany
        });
    } catch (error) {
        console.error("Error in updating company:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating company",
            error
        });
    }
};

// Delete company
export const deleteCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await companyModel.findById(companyId);

        if (!company) {
            return res.status(404).send({
                success: false,
                message: "company not found",
                errorType: "companyNotFound"
            });
        }

        await companyModel.findByIdAndDelete(companyId);

        res.status(200).send({
            success: true,
            message: "company deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleting company:", error);
        res.status(500).send({
            success: false,
            message: "Error in deleting company",
            error
        });
    }
};

// Get Company by User ID
export const getCompanyByUser = async (req, res) => {
    try {
        // Assuming user ID is available in req.user._id from authentication middleware
        const userId = req.params.id;
        const company = await companyModel.find({ userId: userId }); // Find company by user ID

        if (!company) {
            return res.status(404).send({
                success: false,
                message: "Company not found for this user",
                errorType: "companyNotFound"
            });
        }

        res.status(200).send({
            success: true,
            message: "Company fetched successfully",
            company
        });

    } catch (error) {
        console.error("Error in getting user company:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting user company",
            error
        });
    }
};

// Get Company by Phone Number
export const getCompanyByPhone = async (req, res) => {
    try {
        const { phone } = req.params; // Assuming phone number is passed as a URL parameter

        if (!phone) {
            return res.status(400).send({
                success: false,
                message: "Phone number is required",
            });
        }

        // Search for a company where any contact person's mobile matches the provided phone
        const last8 = phone.slice(-8);

        const company = await companyModel.findOne({
            "contactPersons.mobile": { $regex: last8 + '$' }
        });


        if (!company) {
            return res.status(404).send({
                success: false,
                message: "Company not found with this phone number",
                errorType: "companyNotFound"
            });
        }

        res.status(200).send({
            success: true,
            message: "Company fetched successfully by phone number",
            company
        });

    } catch (error) {
        console.error("Error in getting company by phone:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting company by phone",
            error
        });
    }
};