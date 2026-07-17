import Report from "../../models/reportModel.js";
import Company from "../../models/companyModel.js"; // Assuming Company model path
import Employee from "../../models/employeeModel.js";
import Counter from "../../models/counterModel.js";
import mongoose from "mongoose";
import { normalizeSendDetailsTo } from "../../utils/normalizeSendDetailsTo.js";

const DELIVERY_CHALLAN_TYPES = ["Service_Delivery_Challan", "Rental_Delivery_Challan"];
const VALID_CONTENT_SCOPES = ["Service", "Product", "Service + Product"];

const ASSIGNED_TO_USER_SELECT =
    "-password -wishlist -expoPushTokens -commissionCategorys -serviceDeliveryAddresses";

const validateContentScope = (reportType, contentScope) => {
    if (DELIVERY_CHALLAN_TYPES.includes(reportType)) {
        if (!contentScope || !VALID_CONTENT_SCOPES.includes(String(contentScope).trim())) {
            return "Delivery Challan (DC Copy) requires Service/Product selection (Service, Product, or Service + Product).";
        }
    } else if (contentScope != null && contentScope !== "" && !VALID_CONTENT_SCOPES.includes(String(contentScope).trim())) {
        return "Invalid Service/Product selection.";
    }
    return null;
};

/**
 * Report.assignedTo refs User, but employee fields (idCradNo, designation, etc.)
 * live on Employee (linked by userId). Merge those into assignedTo for API consumers.
 */
const enrichReportsWithEmployeeDetails = async (reports) => {
    const list = Array.isArray(reports) ? reports : reports ? [reports] : [];
    if (list.length === 0) return reports;

    const userIds = [
        ...new Set(
            list
                .map((r) => {
                    const a = r?.assignedTo;
                    if (!a) return null;
                    return String(a._id || a);
                })
                .filter(Boolean)
        ),
    ];

    if (userIds.length === 0) return reports;

    const employees = await Employee.find({ userId: { $in: userIds } })
        .select("-password")
        .populate("department", "name")
        .lean();

    const employeeByUserId = new Map(
        employees.map((e) => [String(e.userId), e])
    );

    const mergeOne = (report) => {
        const obj = typeof report.toObject === "function" ? report.toObject() : { ...report };
        if (!obj.assignedTo) return obj;

        const assigned =
            typeof obj.assignedTo === "object"
                ? { ...obj.assignedTo }
                : { _id: obj.assignedTo };

        // Never expose password hash
        delete assigned.password;

        const emp = employeeByUserId.get(String(assigned._id || obj.assignedTo));
        if (emp) {
            assigned.idCradNo = emp.idCradNo || "";
            assigned.designation = emp.designation || [];
            assigned.employeeType = emp.employeeType || [];
            assigned.department = emp.department || [];
            assigned.image = emp.image || assigned.image || "";
            assigned.pincode = emp.pincode || [];
            assigned.employeeId = emp._id;
            assigned.salary = emp.salary;
            assigned.bikeAllowance = emp.bikeAllowance;
            assigned.parentName = emp.parentName || "";
            assigned.parentPhone = emp.parentPhone || "";
            assigned.parentAddress = emp.parentAddress || "";
            assigned.parentRelation = emp.parentRelation || "";
            assigned.idProof = emp.idProof || "";
            assigned.hireDate = emp.hireDate;
            // Prefer employee profile name/phone/address when present
            if (emp.name) assigned.name = emp.name;
            if (emp.phone) assigned.phone = emp.phone;
            if (emp.address) assigned.address = emp.address;
            if (emp.email) assigned.email = emp.email;
        }

        obj.assignedTo = assigned;
        return obj;
    };

    if (Array.isArray(reports)) {
        return list.map(mergeOne);
    }
    return mergeOne(list[0]);
};

/** Match service/rental reports or gate passes by URL scope (exact type, not combined). */
const buildReportScopeFilter = (urlScope) => {
    if (!urlScope) return null;
    const scope = String(urlScope);

    const exactScopeFilters = {
        Service_Report: {
            $or: [
                { reportType: "Service_Report" },
                {
                    reportFor: { $in: ["service", "Service_Report"] },
                    reportType: { $nin: ["Service_Gate_Pass", "Service_Delivery_Challan", "Service_Returnable_Challan"] },
                },
            ],
        },
        Service_Gate_Pass: {
            $or: [
                { reportType: "Service_Gate_Pass" },
                { reportFor: "Service_Gate_Pass" },
            ],
        },
        Service_Delivery_Challan: {
            $or: [
                { reportType: "Service_Delivery_Challan" },
                { reportFor: "Service_Delivery_Challan" },
            ],
        },
        Service_Returnable_Challan: {
            $or: [
                { reportType: "Service_Returnable_Challan" },
                { reportFor: "Service_Returnable_Challan" },
            ],
        },
        Rental_Report: {
            $or: [
                { reportType: "Rental_Report" },
                {
                    reportFor: { $in: ["rental", "Rental_Report"] },
                    reportType: { $nin: ["Rental_Gate_Pass", "Rental_Delivery_Challan", "Rental_Returnable_Challan"] },
                },
            ],
        },
        Rental_Gate_Pass: {
            $or: [
                { reportType: "Rental_Gate_Pass" },
                { reportFor: "Rental_Gate_Pass" },
            ],
        },
        Rental_Delivery_Challan: {
            $or: [
                { reportType: "Rental_Delivery_Challan" },
                { reportFor: "Rental_Delivery_Challan" },
            ],
        },
        Rental_Returnable_Challan: {
            $or: [
                { reportType: "Rental_Returnable_Challan" },
                { reportFor: "Rental_Returnable_Challan" },
            ],
        },
    };

    if (exactScopeFilters[scope]) {
        return exactScopeFilters[scope];
    }

    const lower = scope.toLowerCase();
    if (lower === "service") {
        return {
            $or: [
                { reportFor: { $in: ["service", "Service_Report", "Service_Gate_Pass"] } },
                { reportType: { $in: ["Service_Report", "Service_Gate_Pass"] } },
            ],
        };
    }
    if (lower === "rental") {
        return {
            $or: [
                { reportFor: { $in: ["rental", "Rental_Report", "Rental_Gate_Pass"] } },
                { reportType: { $in: ["Rental_Report", "Rental_Gate_Pass"] } },
            ],
        };
    }
    return null;
};

// Create Report
export const createReport = async (req, res) => {
    try {
        const {
            serviceId,
            reportType,
            reportFor,
            company, // This should be the company's ObjectId
            sendDetailsTo,
            problemReport,
            remarksPendingWorks,
            accessService,
            accessories,
            modelNo,
            serialNo,
            branch,
            reference,
            assignedTo,
            usageData,
            description,
            contentScope,
            materialGroups // Changed from 'materials' to 'materialGroups'
        } = req.body;

        // Basic Validation
        if (!reportType || !company || !problemReport || !branch) {
            return res.status(400).send({
                success: false,
                message: 'Missing required fields: reportType, company, problemReport, branch.',
            });
        }

        const contentScopeError = validateContentScope(reportType, contentScope);
        if (contentScopeError) {
            return res.status(400).send({ success: false, message: contentScopeError });
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

        const counter = await Counter.findOneAndUpdate(
            { key: "reportNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        ).lean();
        const reportNumber = Number(counter?.seq || 0) || 0;

        const newReport = new Report({
            reportNumber: reportNumber > 0 ? reportNumber : undefined,
            reportType,
            serviceId,
            reportFor,
            company,
            sendDetailsTo: normalizeSendDetailsTo(sendDetailsTo),
            problemReport,
            remarksPendingWorks,
            accessService,
            accessories,
            modelNo,
            serialNo,
            branch,
            reference,
            assignedTo,
            usageData,
            description,
            contentScope: contentScope ? String(contentScope).trim() : undefined,
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
        // Backward-compat: some integrations call GET /api/v1/report/:id
        // but our primary "by id" route is /getById/:id.
        const maybeId = req.params?.reportType;
        if (maybeId && mongoose.Types.ObjectId.isValid(maybeId)) {
            const report = await Report.findById(maybeId)
                .populate("company")
                .populate({ path: "assignedTo", select: ASSIGNED_TO_USER_SELECT });
            if (!report) {
                return res.status(404).send({ success: false, message: "Report not found" });
            }
            const enrichedReport = await enrichReportsWithEmployeeDetails(report);
            return res.status(200).send({
                success: true,
                message: "Report fetched successfully",
                report: enrichedReport,
            });
        }

        const {
            fromDate,
            toDate,
            companyName,
            assignedTo,
            reportType,
            reportFor: reportForQuery,
            serialNo,
            page = 1, // Default to page 1
            limit = 10 // Default to 10 items per page
        } = req.query; // Get parameters from query string

        const urlScope = req.params?.reportType;
        const assignedToParam = req.params?.assignedTo;
        const andConditions = [];

        const scopeFilter = buildReportScopeFilter(urlScope);
        if (scopeFilter) {
            andConditions.push(scopeFilter);
        } else if (reportForQuery) {
            andConditions.push({ reportFor: reportForQuery });
        }

        // Filter by reportType label when not already covered by URL scope
        if (reportType && !scopeFilter) {
            andConditions.push({ reportType });
        }

        // Filter by assignedTo (query param or /getByassigned/:assignedTo/... path)
        if (assignedTo) {
            andConditions.push({ assignedTo });
        } else if (assignedToParam && mongoose.Types.ObjectId.isValid(assignedToParam)) {
            andConditions.push({ assignedTo: assignedToParam });
        }

        // Filter by companyName
        if (companyName) {
            const matchingCompanies = await Company.find({
                companyName: { $regex: companyName, $options: 'i' } // Case-insensitive partial match
            }).select('_id');

            const companyIds = matchingCompanies.map(company => company._id);

            if (companyIds.length > 0) {
                andConditions.push({ company: { $in: companyIds } });
            } else {
                // If no companies match the name, no reports will match, so return empty
                return res.status(200).send({ success: true, message: 'No Reports found for the given company name', reports: [], totalCount: 0 });
            }
        }

        // Filter by date range (createdAt)
        if (fromDate || toDate) {
            const createdAt = {};
            if (fromDate) {
                createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                // Set to the end of the day for the toDate
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                createdAt.$lte = endOfDay;
            }
            andConditions.push({ createdAt });
        }

        // Filter by serial number (report-level or material line items)
        const serialTerm = String(serialNo || "").trim();
        if (serialTerm) {
            const serialRegex = { $regex: serialTerm, $options: "i" };
            andConditions.push({
                $or: [
                    { serialNo: serialRegex },
                    { "materialGroups.serialNo": serialRegex },
                    { "materialGroups.products.serialNo": serialRegex },
                ],
            });
        }

        const findQuery = andConditions.length > 0 ? { $and: andConditions } : {};

        // Calculate skip for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count of documents matching the filters (before pagination)
        const totalCount = await Report.countDocuments(findQuery);

        // Fetch reports with pagination and populate necessary fields
        const reports = await Report.find(findQuery)
            .populate('company') // Populate company details
            .populate({ path: 'assignedTo', select: ASSIGNED_TO_USER_SELECT })
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            .skip(skip)
            .limit(parseInt(limit));

        const enrichedReports = await enrichReportsWithEmployeeDetails(reports);

        res.status(200).send({ success: true, message: 'All Reports fetched', reports: enrichedReports, totalCount });
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
            .populate('company')
            .populate({ path: 'assignedTo', select: ASSIGNED_TO_USER_SELECT });

        if (!report) {
            return res.status(404).send({ success: false, message: 'Report not found' });
        }
        const enrichedReport = await enrichReportsWithEmployeeDetails(report);
        res.status(200).send({ success: true, message: 'Report fetched successfully', report: enrichedReport });
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
            sendDetailsTo,
            problemReport,
            remarksPendingWorks,
            accessService,
            accessories,
            modelNo,
            serialNo,
            branch,
            reference,
            assignedTo,
            usageData,
            description,
            contentScope,
            materialGroups, // Changed from 'materials' to 'materialGroups'
            reportLink,
        } = req.body;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).send({ success: false, message: 'Report not found.' });
        }

        const effectiveReportType = reportType || report.reportType;
        const effectiveContentScope = contentScope !== undefined ? contentScope : report.contentScope;
        const contentScopeError = validateContentScope(effectiveReportType, effectiveContentScope);
        if (contentScopeError) {
            return res.status(400).send({ success: false, message: contentScopeError });
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
                ...(sendDetailsTo !== undefined ? { sendDetailsTo: normalizeSendDetailsTo(sendDetailsTo) } : {}),
                problemReport,
                remarksPendingWorks,
                accessService,
                accessories,
                modelNo,
                serialNo,
                branch,
                reference,
                assignedTo,
                usageData,
                description,
                ...(contentScope !== undefined
                    ? { contentScope: contentScope ? String(contentScope).trim() : null }
                    : {}),
                materialGroups: validatedMaterialGroups, // Changed from 'materials'
                ...(reportLink !== undefined ? { reportLink } : {}),
            },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        )
            .populate('company')
            .populate({ path: 'assignedTo', select: ASSIGNED_TO_USER_SELECT });

        const enrichedReport = await enrichReportsWithEmployeeDetails(updatedReport);

        res.status(200).send({ success: true, message: 'Report updated successfully', report: enrichedReport });

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