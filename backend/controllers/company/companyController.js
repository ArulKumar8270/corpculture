import companyModel from "../../models/companyModel.js";
import ServiceInvoice from "../../models/serviceInvoiceModel.js"; // Import ServiceInvoice model
import Report from "../../models/reportModel.js"; // Import Report model
import RentalPaymentEntry from "../../models/rentalPaymentEntryModel.js"; // Import RentalPaymentEntry model

const sanitizeCompanyPayload = (body = {}) => {
    const payload = { ...body };
    if (Array.isArray(payload.serviceDeliveryAddresses)) {
        payload.serviceDeliveryAddresses = payload.serviceDeliveryAddresses.filter(
            (addr) => addr && String(addr.address || "").trim() && String(addr.pincode || "").trim()
        );
    }
    if (Array.isArray(payload.contactPersons)) {
        payload.contactPersons = payload.contactPersons
            .filter((person) => person && String(person.name || "").trim() && String(person.mobile || "").trim())
            .map((person) => ({
                ...person,
                name: String(person.name).trim(),
                mobile: String(person.mobile).trim(),
                email: String(person.email || "").trim(),
            }));
    }
    return payload;
};

const companyValidationMessage = (error) => {
    if (error?.name === "ValidationError" && error.errors) {
        return Object.values(error.errors).map((e) => e.message).join(", ");
    }
    return error?.message || "Error in company creation";
};

// Create Company
export const createCompany = async (req, res) => {
    try {
        const payload = sanitizeCompanyPayload(req.body);
        const company = new companyModel(payload);
        await company.save();

        res.status(201).send({
            success: true,
            message: "Company request created successfully",
            company
        });
    } catch (error) {
        console.error("Error in company creation:", error);
        res.status(400).send({
            success: false,
            message: companyValidationMessage(error),
            error
        });
    }
};

// Get All Companies
export const getAllCompanies = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            skipCounts = '',
        } = req.query;

        const skipCountQueries =
            skipCounts === 'true' || skipCounts === '1' || String(skipCounts).toLowerCase() === 'yes';

        // Build query for search
        let findQuery = {};
        if (search) {
            findQuery = {
                $or: [
                    { companyName: { $regex: search, $options: 'i' } },
                    { pincode: { $regex: search, $options: 'i' } },
                    { gstNo: { $regex: search, $options: 'i' } },
                    { billingAddress: { $regex: search, $options: 'i' } },
                    { city: { $regex: search, $options: 'i' } },
                    { state: { $regex: search, $options: 'i' } },
                    { 'contactPersons.name': { $regex: search, $options: 'i' } },
                    { 'contactPersons.mobile': { $regex: search, $options: 'i' } },
                    { 'contactPersons.email': { $regex: search, $options: 'i' } },
                    { 'contactPersons.designation': { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Calculate skip for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count of documents matching the filters (before pagination)
        const totalCount = await companyModel.countDocuments(findQuery);

        // Fetch companies with pagination
        const companies = await companyModel.find(findQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // Use .lean() for better performance when adding properties

        if (skipCountQueries) {
            return res.status(200).send({
                success: true,
                companies,
                totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
            });
        }

        const companiesWithCounts = await Promise.all(companies.map(async (company) => {
            const [
                serviceInvoiceCount,
                serviceQuotationCount,
                serviceReportCount,
                rentalInvoiceCount,
                rentalQuotationCount,
                rentalReportCount
            ] = await Promise.all([
                ServiceInvoice.countDocuments({
                    companyId: company._id,
                    invoiceType: "invoice",
                    status: "Unpaid",
                }),
                ServiceInvoice.countDocuments({ companyId: company._id, invoiceType: "quotation" }),
                Report.countDocuments({ company: company._id, reportType: "service" }),
                RentalPaymentEntry.countDocuments({
                    companyId: company._id,
                    invoiceType: "invoice",
                    status: "Unpaid",
                }),
                RentalPaymentEntry.countDocuments({ companyId: company._id, invoiceType: "quotation" }),
                Report.countDocuments({ company: company._id, reportType: "rental" })
            ]);

            return {
                ...company,
                serviceInvoiceCount,
                serviceQuotationCount,
                serviceReportCount,
                rentalInvoiceCount,
                rentalQuotationCount,
                rentalReportCount
            };
        }));

        res.status(200).send({
            success: true,
            companies: companiesWithCounts,
            totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / parseInt(limit))
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
            sanitizeCompanyPayload(req.body),
            { new: true, runValidators: true }
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
        const company = await companyModel.find({ "contactPersons.mobile": userId }); // Find company by user ID

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

        const company = await companyModel.find({
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