import RentalProduct from "../../models/rentalProductModel.js";
import Company from "../../models/companyModel.js"; // Assuming this path is correct
import GST from "../../models/gstModel.js"; // Assuming this path is correct

const IST = "Asia/Kolkata";

/** YYYY-MM-DD for "today" in IST (matches business calendar, not UTC midnight). */
function getTodayIstYmd(referenceDate = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: IST,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(referenceDate);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
}

// Helper function to parse and validate config fields
const parseConfigFields = (config) => {
    if (!config) return {};
    return {
        bwOldCount: config.bwOldCount !== undefined ? parseInt(config.bwOldCount) : undefined,
        freeCopiesBw: config.freeCopiesBw !== undefined ? parseInt(config.freeCopiesBw) : undefined,
        extraAmountBw: config.extraAmountBw !== undefined ? parseFloat(config.extraAmountBw) : undefined,
        bwUnlimited: config.bwUnlimited !== undefined ? Boolean(config.bwUnlimited) : undefined,
        colorOldCount: config.colorOldCount !== undefined ? parseInt(config.colorOldCount) : undefined,
        freeCopiesColor: config.freeCopiesColor !== undefined ? parseInt(config.freeCopiesColor) : undefined,
        extraAmountColor: config.extraAmountColor !== undefined ? parseFloat(config.extraAmountColor) : undefined,
        colorUnlimited: config.colorUnlimited !== undefined ? Boolean(config.colorUnlimited) : undefined,
        colorScanningOldCount: config.colorScanningOldCount !== undefined ? parseInt(config.colorScanningOldCount) : undefined,
        freeCopiesColorScanning: config.freeCopiesColorScanning !== undefined ? parseInt(config.freeCopiesColorScanning) : undefined,
        extraAmountColorScanning: config.extraAmountColorScanning !== undefined ? parseFloat(config.extraAmountColorScanning) : undefined,
        colorScanningUnlimited: config.colorScanningUnlimited !== undefined ? Boolean(config.colorScanningUnlimited) : undefined,
    };
};

/** Safe Date for API / n8n (ISO string, number, Date). Invalid → undefined. */
function parseDateInput(value) {
    if (value === undefined || value === null || value === "") return undefined;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

// Create Rental Product
export const createRentalProduct = async (req, res) => {
    try {
        const {
            company, branch, department, modelName, serialNo, hsn, basePrice, gstType, paymentDate,
            openingDate, closingDate,
            modelSpecs, a3Config, a4Config, a5Config,
            commission
        } = req.body;

        // Basic Validation
        if (!company || !branch || !department || !modelName || !serialNo || basePrice === undefined || !gstType || !paymentDate) {
            return res.status(400).send({ success: false, message: 'Company, branch, department, model name, serial number, base price, GST type, and payment date are required.' });
        }
        if (isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) {
            return res.status(400).send({ success: false, message: 'Base Price must be a non-negative number.' });
        }

        // Check if company exists
        const existingCompany = await Company.findById(company);
        if (!existingCompany) {
            return res.status(404).send({ success: false, message: 'Company not found.' });
        }

        // Check if GST type exists
        const existingGstType = await GST.findById(gstType);
        if (!existingGstType) {
            return res.status(404).send({ success: false, message: 'GST Type not found.' });
        }

        // Check if serial number already exists
        const existingProduct = await RentalProduct.findOne({ serialNo });
        if (existingProduct) {
            return res.status(409).send({ success: false, message: 'Rental Product with this serial number already exists.' });
        }

        const newRentalProduct = new RentalProduct({
            company,
            branch,
            department,
            modelName,
            serialNo,
            hsn,
            basePrice: parseFloat(basePrice),
            gstType,
            commission,
            paymentDate: new Date(paymentDate),
            openingDate: openingDate ? new Date(openingDate) : undefined,
            closingDate: closingDate ? new Date(closingDate) : undefined,
            modelSpecs: modelSpecs || {},
            a3Config: parseConfigFields(a3Config),
            a4Config: parseConfigFields(a4Config),
            a5Config: parseConfigFields(a5Config),
        });

        await newRentalProduct.save();
        res.status(201).send({ success: true, message: 'Rental Product created successfully', rentalProduct: newRentalProduct });
    } catch (error) {
        console.error("Error in createRentalProduct:", error);
        res.status(500).send({ success: false, message: 'Error in creating rental product', error });
    }
};

// Get All Rental Products
export const getAllRentalProducts = async (req, res) => {
    try {
        const rentalProducts = await RentalProduct.find({})
            .populate('company') // Populate company name
            .populate('gstType') // Populate GST details
            .sort({ createdAt: -1 });

        res.status(200).send({ success: true, message: 'All Rental Products fetched', rentalProducts });
    } catch (error) {
        console.error("Error in getAllRentalProducts:", error);
        res.status(500).send({ success: false, message: 'Error in getting all rental products', error });
    }
};

// Get Single Rental Product by ID
export const getRentalProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const rentalProduct = await RentalProduct.findById(id)
            .populate('company') // Populate company name
            .populate('gstType')

        if (!rentalProduct) {
            return res.status(404).send({ success: false, message: 'Rental Product not found' });
        }
        res.status(200).send({ success: true, message: 'Rental Product fetched successfully', rentalProduct });
    } catch (error) {
        console.error("Error in getRentalProductById:", error);
        res.status(500).send({ success: false, message: 'Error in getting rental product', error });
    }
};

// Get Rental Products by Company ID
export const getRentalProductsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params; // Assuming companyId is passed as a URL parameter

        if (!companyId) {
            return res.status(400).send({ success: false, message: 'Company ID is required.' });
        }

        const rentalProducts = await RentalProduct.find({ company: companyId })
            .populate('company') // Populate company name
            .populate('gstType')
            .sort({ createdAt: -1 });

        if (rentalProducts.length === 0) {
            return res.status(404).send({ success: false, message: 'No rental products found for this company.' });
        }

        res.status(200).send({ success: true, message: 'Rental Products fetched successfully for the company', rentalProducts });
    } catch (error) {
        console.error("Error in getRentalProductsByCompany:", error);
        res.status(500).send({ success: false, message: 'Error in getting rental products by company', error });
    }
};

// Update Rental Product
// - n8n / automation: send only paymentDate, openingDate, closingDate (no company, gst, etc.)
// - full form: send all required fields as before
export const updateRentalProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            company, branch, department, modelName, serialNo, hsn, basePrice, gstType, paymentDate,
            openingDate, closingDate,
            modelSpecs, a3Config, a4Config, a5Config, employeeId, commission
        } = req.body;

        const hasAnyDateField =
            paymentDate !== undefined ||
            openingDate !== undefined ||
            closingDate !== undefined;
        const hasOtherCoreFields =
            company !== undefined ||
            branch !== undefined ||
            department !== undefined ||
            modelName !== undefined ||
            serialNo !== undefined ||
            basePrice !== undefined ||
            gstType !== undefined ||
            hsn !== undefined;

        // Body has only date fields (e.g. n8n) — no company, serial, gst, etc.
        const datesOnlyUpdate = hasAnyDateField && !hasOtherCoreFields;

        if (datesOnlyUpdate) {
            const $set = {};
            const pd = parseDateInput(paymentDate);
            const od = parseDateInput(openingDate);
            const cd = parseDateInput(closingDate);
            if (pd !== undefined) $set.paymentDate = pd;
            if (od !== undefined) $set.openingDate = od;
            if (cd !== undefined) $set.closingDate = cd;
            if (Object.keys($set).length === 0) {
                return res.status(400).send({
                    success: false,
                    message: "Provide at least one valid date: paymentDate, openingDate, or closingDate.",
                });
            }
            const updatedRentalProduct = await RentalProduct.findByIdAndUpdate(
                id,
                { $set },
                { new: true, runValidators: true }
            )
                .populate("company")
                .populate("gstType");
            if (!updatedRentalProduct) {
                return res.status(404).send({ success: false, message: "Rental Product not found for update." });
            }
            return res.status(200).send({
                success: true,
                message: "Rental Product dates updated successfully",
                rentalProduct: updatedRentalProduct,
            });
        }

        // Full update (existing behaviour)
        if (!company || !branch || !department || !modelName || !serialNo || basePrice === undefined || !gstType || !paymentDate) {
            return res.status(400).send({ success: false, message: 'Company, branch, department, model name, serial number, base price, GST type, and payment date are required for update.' });
        }
        if (isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) {
            return res.status(400).send({ success: false, message: 'Base Price must be a non-negative number.' });
        }

        const existingCompany = await Company.findById(company);
        if (!existingCompany) {
            return res.status(404).send({ success: false, message: 'Company not found.' });
        }

        const existingGstType = await GST.findById(gstType);
        if (!existingGstType) {
            return res.status(404).send({ success: false, message: 'GST Type not found.' });
        }

        const duplicateSerialNo = await RentalProduct.findOne({ serialNo, _id: { $ne: id } });
        if (duplicateSerialNo) {
            return res.status(409).send({ success: false, message: 'Another Rental Product with this serial number already exists.' });
        }

        const pdFull = parseDateInput(paymentDate);
        if (pdFull === undefined) {
            return res.status(400).send({ success: false, message: "Invalid paymentDate." });
        }

        const updatedRentalProduct = await RentalProduct.findByIdAndUpdate(
            id,
            {
                company,
                branch,
                department,
                modelName,
                serialNo,
                hsn,
                basePrice: parseFloat(basePrice),
                gstType,
                commission,
                paymentDate: pdFull,
                openingDate: parseDateInput(openingDate),
                closingDate: parseDateInput(closingDate),
                modelSpecs: modelSpecs || {},
                a3Config: parseConfigFields(a3Config),
                a4Config: parseConfigFields(a4Config),
                a5Config: parseConfigFields(a5Config),
                employeeId
            },
            { new: true, runValidators: true }
        );

        if (!updatedRentalProduct) {
            return res.status(404).send({ success: false, message: 'Rental Product not found for update.' });
        }
        res.status(200).send({ success: true, message: 'Rental Product updated successfully', rentalProduct: updatedRentalProduct });
    } catch (error) {
        console.error("Error in updateRentalProduct:", error);
        res.status(500).send({ success: false, message: 'Error in updating rental product', error });
    }
};

// Delete Rental Product
export const deleteRentalProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRentalProduct = await RentalProduct.findByIdAndDelete(id);

        if (!deletedRentalProduct) {
            return res.status(404).send({ success: false, message: 'Rental Product not found for deletion.' });
        }
        res.status(200).send({ success: true, message: 'Rental Product deleted successfully' });
    } catch (error) {
        console.error("Error in deleteRentalProduct:", error);
        res.status(500).send({ success: false, message: 'Error in deleting rental product', error });
    }
};

// Get Today's Rental Products (one row per company; all serial numbers combined)
// - Uses IST calendar date for paymentDate (automation in India + date-only UTC storage were missing rows).
// - Serial list keeps one entry per product; empty serial is "(no serial)" so counts match automation runs.
// - ?flat=1 — no grouping (one API row per rental product document).
export const getTodaysRentalProducts = async (req, res) => {
    try {
        const todayIstYmd = getTodayIstYmd();

        const rentalProducts = await RentalProduct.find({
            $expr: {
                $eq: [
                    {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$paymentDate",
                            timezone: IST,
                        },
                    },
                    todayIstYmd,
                ],
            },
        })
            .populate("company")
            .populate("gstType")
            .sort({ createdAt: -1 })
            .lean();

        const totalRentalProducts = rentalProducts.length;

        const flat =
            req.query?.flat === "1" ||
            req.query?.flat === "true" ||
            req.query?.groupByCompany === "false";

        if (flat) {
            return res.status(200).json({
                success: true,
                paymentDateIst: todayIstYmd,
                totalRentalProducts,
                products: rentalProducts,
            });
        }

        const byCompany = new Map();
        for (const p of rentalProducts) {
            const companyId = p.company?._id ? String(p.company._id) : String(p.company || "");
            const key = companyId || `unknown-${p._id}`;
            if (!byCompany.has(key)) {
                byCompany.set(key, []);
            }
            byCompany.get(key).push(p);
        }

        const products = [];
        for (const group of byCompany.values()) {
            const serialNos = group.map((x) =>
                x.serialNo != null && String(x.serialNo).trim() !== ""
                    ? String(x.serialNo).trim()
                    : "(no serial)"
            );
            const first = { ...group[0] };
            products.push({
                ...first,
                serialNo: serialNos.join(", "),
                serialNos,
                rentalProductIds: group.map((x) => x._id),
                _groupedCount: group.length,
            });
        }

        res.status(200).json({
            success: true,
            paymentDateIst: todayIstYmd,
            totalRentalProducts,
            groupedRowCount: products.length,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};