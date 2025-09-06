import Report from "../../models/reportModel.js";
import Company from "../../models/companyModel.js"; // Assuming Company model path

// Create Report
export const createReport = async (req, res) => {
    try {
        const {
            serviceId,
            reportType,
            reportFor,
            company, // This should be the company's ObjectId
            problemReport,
            remarksPendingWorks,
            accessService,
            modelNo,
            serialNo,
            branch,
            reference,
            assignedTo,
            usageData,
            description,
            materialGroups // Changed from 'materials' to 'materialGroups'
        } = req.body;

        // Basic Validation
        if (!reportType || !company || !problemReport || !modelNo || !serialNo || !branch) {
            return res.status(400).send({ success: false, message: 'Missing required fields: reportType, company, problemReport, modelNo, serialNo, branch.' });
        }

        // Validate Company ID
        const existingCompany = await Company.findById(company);
        if (!existingCompany) {
            return res.status(404).send({ success: false, message: 'Company not found.' });
        }

        let validatedMaterialGroups = [];
        if (materialGroups) {
            if (!Array.isArray(materialGroups)) {
                return res.status(400).send({ success: false, message: 'Material groups must be a valid array.' });
            }
            for (const group of materialGroups) {
                if (!group.name || !Array.isArray(group.products)) {
                    return res.status(400).send({ success: false, message: 'Each material group must have a name and a products array.' });
                }
                for (const item of group.products) {
                    if (!item.productName || item.quantity === undefined || item.rate === undefined || item.totalAmount === undefined) {
                        return res.status(400).send({ success: false, message: 'Each material item must have productName, quantity, rate, and totalAmount.' });
                    }
                    if (isNaN(item.quantity) || item.quantity < 0 || isNaN(item.rate) || item.rate < 0 || isNaN(item.totalAmount) || item.totalAmount < 0) {
                        return res.status(400).send({ success: false, message: 'Quantity, rate, and totalAmount for materials must be non-negative numbers.' });
                    }
                }
                validatedMaterialGroups.push(group); // Add validated group
            }
        }

        const newReport = new Report({
            reportType,
            serviceId,
            reportFor,
            company,
            problemReport,
            remarksPendingWorks,
            accessService,
            modelNo,
            serialNo,
            branch,
            reference,
            assignedTo,
            usageData,
            description,
            materialGroups: validatedMaterialGroups, // Changed from 'materials'
        });

        await newReport.save();

        res.status(201).send({ success: true, message: 'Report created successfully', report: newReport });

    } catch (error) {
        console.error("Error in createReport:", error);
        res.status(500).send({ success: false, message: 'Error in creating report', error });
    }
};

// Get All Reports
export const getAllReports = async (req, res) => {
    try {
        const {
            fromDate,
            toDate,
            companyName,
            assignedTo,
            reportType,
            page = 1, // Default to page 1
            limit = 10 // Default to 10 items per page
        } = req.query; // Get parameters from query string

        let findQuery = {};

        // Filter by reportType
        if (reportType) {
            findQuery.reportType = reportType;
        }

        // Filter by assignedTo
        if (assignedTo) {
            findQuery.assignedTo = assignedTo;
        }

        // Filter by companyName
        if (companyName) {
            const matchingCompanies = await Company.find({
                companyName: { $regex: companyName, $options: 'i' } // Case-insensitive partial match
            }).select('_id');

            const companyIds = matchingCompanies.map(company => company._id);

            if (companyIds.length > 0) {
                findQuery.company = { $in: companyIds };
            } else {
                // If no companies match the name, no reports will match, so return empty
                return res.status(200).send({ success: true, message: 'No Reports found for the given company name', reports: [], totalCount: 0 });
            }
        }

        // Filter by date range (createdAt)
        if (fromDate || toDate) {
            findQuery.createdAt = {};
            if (fromDate) {
                findQuery.createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                // Set to the end of the day for the toDate
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                findQuery.createdAt.$lte = endOfDay;
            }
        }

        // Calculate skip for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count of documents matching the filters (before pagination)
        const totalCount = await Report.countDocuments(findQuery);

        // Fetch reports with pagination and populate necessary fields
        const reports = await Report.find(findQuery)
            .populate('company') // Populate company details
            .populate('assignedTo') // Populate assignedTo user details
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).send({ success: true, message: 'All Reports fetched', reports, totalCount });
    } catch (error) {
        console.error("Error in getAllReports:", error);
        res.status(500).send({ success: false, message: 'Error in getting reports', error });
    }
};

// Get Single Report by ID
export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findById(id)
            .populate('company'); // Populate company details

        if (!report) {
            return res.status(404).send({ success: false, message: 'Report not found' });
        }
        res.status(200).send({ success: true, message: 'Report fetched successfully', report });
    } catch (error) {
        console.error("Error in getReportById:", error);
        res.status(500).send({ success: false, message: 'Error in getting report', error });
    }
};

// Update Report
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            reportType,
            reportFor,
            company,
            problemReport,
            remarksPendingWorks,
            accessService,
            modelNo,
            serialNo,
            branch,
            reference,
            assignedTo,
            usageData,
            description,
            materialGroups // Changed from 'materials' to 'materialGroups'
        } = req.body;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).send({ success: false, message: 'Report not found.' });
        }

        // Validate Company ID if provided in the update
        if (company) {
            const existingCompany = await Company.findById(company);
            if (!existingCompany) {
                return res.status(404).send({ success: false, message: 'Company not found.' });
            }
        }

        let validatedMaterialGroups = report.materialGroups || []; // Default to existing groups or empty array
        if (materialGroups !== undefined) { // Only process if materialGroups is explicitly provided in the update payload
            if (!Array.isArray(materialGroups)) {
                return res.status(400).send({ success: false, message: 'Material groups must be a valid array.' });
            }
            const tempValidatedGroups = [];
            for (const group of materialGroups) {
                if (!group.name || !Array.isArray(group.products)) {
                    return res.status(400).send({ success: false, message: 'Each material group must have a name and a products array.' });
                }
                for (const item of group.products) {
                    if (!item.productName || item.quantity === undefined || item.rate === undefined || item.totalAmount === undefined) {
                        return res.status(400).send({ success: false, message: 'Each material item must have productName, quantity, rate, and totalAmount.' });
                    }
                    if (isNaN(item.quantity) || item.quantity < 0 || isNaN(item.rate) || item.rate < 0 || isNaN(item.totalAmount) || item.totalAmount < 0) {
                        return res.status(400).send({ success: false, message: 'Quantity, rate, and totalAmount for materials must be non-negative numbers.' });
                    }
                }
                tempValidatedGroups.push(group); // Add validated group
            }
            validatedMaterialGroups = tempValidatedGroups; // Use the directly received materialGroups array
        }

        const updatedReport = await Report.findByIdAndUpdate(
            id,
            {
                reportType,
                reportFor,
                company,
                problemReport,
                remarksPendingWorks,
                accessService,
                modelNo,
                serialNo,
                branch,
                reference,
                assignedTo,
                usageData,
                description,
                materialGroups: validatedMaterialGroups, // Changed from 'materials'
            },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        ).populate('company');

        res.status(200).send({ success: true, message: 'Report updated successfully', report: updatedReport });

    } catch (error) {
        console.error("Error in updateReport:", error);
        res.status(500).send({ success: false, message: 'Error in updating report', error });
    }
};

// Delete Report
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReport = await Report.findByIdAndDelete(id);

        if (!deletedReport) {
            return res.status(404).send({ success: false, message: 'Report not found.' });
        }
        res.status(200).send({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        console.error("Error in deleteReport:", error);
        res.status(500).send({ success: false, message: 'Error in deleting report', error });
    }
};