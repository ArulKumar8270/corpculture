import RentalPaymentEntry from "../../models/rentalPaymentEntryModel.js";
import cloudinary from "cloudinary";
import rentalProductModel from "../../models/rentalProductModel.js";

// Create a new rental payment entry
export const createRentalPaymentEntry = async (req, res) => {
    try {
        const {
            machineId,
            invoiceNumber,
            sendDetailsTo,
            remarks,
            companyId,
            countImageUpload,
            assignedTo,
            invoiceType,
            rentalId,
        } = req.body;

        console.log(req.body, "Incoming Rental Entry Request");

        // Parse config JSON strings
        const a3Config = req.body.a3Config ? JSON.parse(req.body.a3Config) : {};
        const a4Config = req.body.a4Config ? JSON.parse(req.body.a4Config) : {};
        const a5Config = req.body.a5Config ? JSON.parse(req.body.a5Config) : {};

        // Basic validation
        if (!machineId || !sendDetailsTo) {
            return res.status(400).send({
                success: false,
                message: "Missing required fields (machineId, sendDetailsTo)",
            });
        }

        // Upload count image
        const result = await cloudinary.v2.uploader.upload(countImageUpload, {
            folder: "rental_payment_entries",
        });

        const countImageUploadUrl = {
            public_id: result.public_id,
            url: result.secure_url,
        };

        // Fetch machine details
        const machine = await rentalProductModel.findById(machineId).populate("gstType");
        if (!machine) {
            return res.status(404).send({
                success: false,
                message: "rentalProductModel not found",
            });
        }

        // Helper to calculate counts
        const calculateCountAmount = (machineOld, entryNew, freeC, extraAmt) => {
            machineOld = parseFloat(machineOld) || 0;
            entryNew = parseFloat(entryNew) || 0;
            freeC = parseFloat(freeC) || 0;
            extraAmt = parseFloat(extraAmt) || 0;

            const copiesUsed = entryNew - machineOld;
            if (copiesUsed <= 0) return 0;
            const billableCopies = Math.max(0, copiesUsed - freeC);
            return billableCopies * extraAmt;
        };

        // Base price
        let totalBillableAmount = parseFloat(machine.basePrice) || 0;

        // A3 calculation
        if (machine.a3Config && a3Config) {
            totalBillableAmount += calculateCountAmount(machine.a3Config.bwOldCount, a3Config.bwNewCount, machine.a3Config.freeCopiesBw, machine.a3Config.extraAmountBw);
            totalBillableAmount += calculateCountAmount(machine.a3Config.colorOldCount, a3Config.colorNewCount, machine.a3Config.freeCopiesColor, machine.a3Config.extraAmountColor);
            totalBillableAmount += calculateCountAmount(machine.a3Config.colorScanningOldCount, a3Config.colorScanningNewCount, machine.a3Config.freeCopiesColorScanning, machine.a3Config.extraAmountColorScanning);
        }

        // A4 calculation
        if (machine.a4Config && a4Config) {
            totalBillableAmount += calculateCountAmount(machine.a4Config.bwOldCount, a4Config.bwNewCount, machine.a4Config.freeCopiesBw, machine.a4Config.extraAmountBw);
            totalBillableAmount += calculateCountAmount(machine.a4Config.colorOldCount, a4Config.colorNewCount, machine.a4Config.freeCopiesColor, machine.a4Config.extraAmountColor);
            totalBillableAmount += calculateCountAmount(machine.a4Config.colorScanningOldCount, a4Config.colorScanningNewCount, machine.a4Config.freeCopiesColorScanning, machine.a4Config.extraAmountColorScanning);
        }

        // A5 calculation
        if (machine.a5Config && a5Config) {
            totalBillableAmount += calculateCountAmount(machine.a5Config.bwOldCount, a5Config.bwNewCount, machine.a5Config.freeCopiesBw, machine.a5Config.extraAmountBw);
            totalBillableAmount += calculateCountAmount(machine.a5Config.colorOldCount, a5Config.colorNewCount, machine.a5Config.freeCopiesColor, machine.a5Config.extraAmountColor);
            totalBillableAmount += calculateCountAmount(machine.a5Config.colorScanningOldCount, a5Config.colorScanningNewCount, machine.a5Config.freeCopiesColorScanning, machine.a5Config.extraAmountColorScanning);
        }

        // Calculate GST
        let totalGSTPercentage = 0;
        if (machine.gstType && machine.gstType.length > 0) {
            totalGSTPercentage = machine.gstType.reduce(
                (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
                0
            );
        }

        const totalWithGST = totalBillableAmount * (1 + totalGSTPercentage / 100);

        // Commission (machine-level or assigned user)
        const commissionRate = parseFloat(machine.commission || 0);
        const commissionAmount = (totalWithGST * commissionRate) / 100;

        const grandTotal = totalWithGST + commissionAmount;

        // Create new entry
        const newEntry = new RentalPaymentEntry({
            machineId,
            invoiceNumber,
            rentalId,
            companyId,
            sendDetailsTo,
            countImageUpload: countImageUploadUrl,
            assignedTo,
            invoiceType,
            remarks,
            a3Config,
            a4Config,
            a5Config,
            grandTotal: grandTotal.toFixed(2),
        });

        await newEntry.save();

        const populatedInvoice = await RentalPaymentEntry.findById(newEntry._id)
            .populate("companyId")
            .populate("machineId")
            .populate("assignedTo")
            .populate("machineId.gstType");

        res.status(201).send({
            success: true,
            message: "Rental Payment Entry created successfully",
            entry: populatedInvoice,
        });

    } catch (error) {
        console.error("Error in createRentalPaymentEntry:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating rental payment entry",
            error,
        });
    }
};

// Get all rental payment entries
export const getAllRentalPaymentEntries = async (req, res) => {
    try {
        const {
            fromDate,
            toDate,
            companyName,
            invoiceNumber,
            paymentStatus, // This will map to 'status' in the schema
            invoiceType, // Assuming this can also be a filter
            page = 1, // Default to page 1
            limit = 10, // Default to 10 items per page
            ...otherFilters // Catch any other direct filters
        } = req.body;

        let query = {};

        // Add invoiceType filter if provided
        if (invoiceType) {
            query.invoiceType = invoiceType;
        }

        // Add invoiceNumber filter if provided
        if (invoiceNumber) {
            // Using regex for partial match and case-insensitivity
            query.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
        }

        // Map paymentStatus to schema's 'status' field
        if (paymentStatus) {
            query.status = paymentStatus;
        }

        // Handle companyName filter
        if (companyName) {
            const companies = await Company.find({ companyName: { $regex: companyName, $options: 'i' } }).select('_id');
            const companyIds = companies.map(company => company._id);
            if (companyIds.length > 0) {
                query.companyId = { $in: companyIds };
            } else {
                // If no companies match the name, return empty results
                return res.status(200).send({ success: true, message: 'No service invoices found for the specified company name.', serviceInvoices: [], totalCount: 0 });
            }
        }

        // Add date range filtering for invoiceDate
        if (fromDate || toDate) {
            query.entryDate = {};
            if (fromDate) {
                query.entryDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.entryDate.$lte = endOfDay;
            }
        }

        // Add any other direct filters from req.body
        for (const key in otherFilters) {
            if (otherFilters.hasOwnProperty(key)) {
                query[key] = otherFilters[key];
            }
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Get total count of documents matching the query (before pagination)
        const totalCount = await RentalPaymentEntry.countDocuments(query);

        const entries = await RentalPaymentEntry.find(query)
            .populate({
                path: 'machineId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate('companyId') // Populate company name
            .populate('assignedTo') // Populate product details // Populate company details
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).send({
            success: true,
            message: 'All rental payment entries fetched successfully',
            entries,
            totalCount
        });
    } catch (error) {
        console.error("Error in getAllRentalPaymentEntries:", error);
        res.status(500).send({
            success: false,
            message: 'Error in fetching all rental payment entries',
            error
        });
    }
};

// Get single rental payment entry by ID
export const getRentalPaymentEntryById = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await RentalPaymentEntry.findById(id)
            .populate({
                path: 'machineId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate('companyId') // Populate company name
            .populate('assignedTo') // Populate company details

        if (!entry) {
            return res.status(404).send({
                success: false,
                message: 'Rental Payment Entry not found'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Rental Payment Entry fetched successfully',
            entry
        });
    } catch (error) {
        console.error("Error in getRentalPaymentEntryById:", error);
        res.status(500).send({
            success: false,
            message: 'Error in fetching rental payment entry by ID',
            error
        });
    }
};


// Get Service rental by assignedTo
export const getRentalInvoiceAssignedTo = async (req, res) => {
    try {
        const { assignedTo, invoiceType } = req.params; // Assuming phone is passed as a URL parameter

        if (!assignedTo) {
            return res.status(400).send({
                success: false,
                message: "assigned to is required",
                errorType: "missingParameter"
            });
        }

        let query = {};
        if (invoiceType && assignedTo) {
            query = { invoiceType, assignedTo, tdsAmount: { $eq: null } };
        }

        const entries = await RentalPaymentEntry.find(query).populate({
            path: 'machineId', // First populate productId
            populate: {
                path: 'gstType',        // Then populate gstType inside the product
            }
        })// Populate product details
            .populate('companyId') // Populate company name
            .populate('assignedTo')
            .sort({ createdAt: -1 }); // Find services by phone number

        if (!entries || entries.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No entries found for this assigned to",
                errorType: "entriesNotFound"
            });
        }

        res.status(200).send({
            success: true,
            entries
        });
    } catch (error) {
        console.error("Error in getting entries by phone:", error); // Log the error
        res.status(500).send({
            success: false,
            message: "Error in getting entries by phone",
            error
        });
    }
};

// Update a rental payment entry
export const updateRentalPaymentEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            machineId,
            invoiceNumber,
            sendDetailsTo,
            remarks,
            companyId,
            countImageUpload,
            modeOfPayment,
            bankName,
            transactionDetails,
            chequeDate,
            pendingAmount,
            tdsAmount,
            paymentAmountType,
            transferDate,
            companyNamePayment,
            otherPaymentMode,
            paymentAmount,
            invoiceLink,
            invoiceType,
            staus
        } = req.body;

        const a3Config = req.body.a3Config ? JSON.parse(req.body.a3Config) : undefined;
        const a4Config = req.body.a4Config ? JSON.parse(req.body.a4Config) : undefined;
        const a5Config = req.body.a5Config ? JSON.parse(req.body.a5Config) : undefined;

        let entry = await RentalPaymentEntry.findById(id);

        if (!entry) {
            return res.status(404).send({ success: false, message: 'Rental Payment Entry not found.' });
        }

        // Handle image upload if a new one is provided
        let countImageUploadUrl = entry.countImageUpload;
        if (countImageUpload) {
            if (entry.countImageUpload && entry.countImageUpload.public_id) {
                await cloudinary.v2.uploader.destroy(entry.countImageUpload.public_id);
            }

            const result = await cloudinary.v2.uploader.upload(countImageUpload, {
                folder: "rental_payment_entries",
            });
            countImageUploadUrl = {
                public_id: result.public_id,
                url: result.secure_url,
            };
        }

        // Update fields
        entry.machineId = machineId || entry.machineId;
        entry.sendDetailsTo = sendDetailsTo || entry.sendDetailsTo;
        entry.remarks = remarks || entry.remarks;

        // Update nested config objects
        if (a3Config) {
            entry.a3Config.bwOldCount = a3Config.bwOldCount ?? entry.a3Config.bwOldCount;
            entry.a3Config.bwNewCount = a3Config.bwNewCount ?? entry.a3Config.bwNewCount;
            entry.a3Config.colorOldCount = a3Config.colorOldCount ?? entry.a3Config.colorOldCount;
            entry.a3Config.colorNewCount = a3Config.colorNewCount ?? entry.a3Config.colorNewCount;
            entry.a3Config.colorScanningOldCount = a3Config.colorScanningOldCount ?? entry.a3Config.colorScanningOldCount;
            entry.a3Config.colorScanningNewCount = a3Config.colorScanningNewCount ?? entry.a3Config.colorScanningNewCount;
        }
        if (a4Config) {
            entry.a4Config.bwOldCount = a4Config.bwOldCount ?? entry.a4Config.bwOldCount;
            entry.a4Config.bwNewCount = a4Config.bwNewCount ?? entry.a4Config.bwNewCount;
            entry.a4Config.colorOldCount = a4Config.colorOldCount ?? entry.a4Config.colorOldCount;
            entry.a4Config.colorNewCount = a4Config.colorNewCount ?? entry.a4Config.colorNewCount;
            entry.a4Config.colorScanningOldCount = a4Config.colorScanningOldCount ?? entry.a4Config.colorScanningOldCount;
            entry.a4Config.colorScanningNewCount = a4Config.colorScanningNewCount ?? entry.a4Config.colorScanningNewCount;
        }
        if (a5Config) {
            entry.a5Config.bwOldCount = a5Config.bwOldCount ?? entry.a5Config.bwOldCount;
            entry.a5Config.bwNewCount = a5Config.bwNewCount ?? entry.a5Config.bwNewCount;
            entry.a5Config.colorOldCount = a5Config.colorOldCount ?? entry.a5Config.colorOldCount;
            entry.a5Config.colorNewCount = a5Config.colorNewCount ?? entry.a5Config.colorNewCount;
            entry.a5Config.colorScanningOldCount = a5Config.colorScanningOldCount ?? entry.a5Config.colorScanningOldCount;
            entry.a5Config.colorScanningNewCount = a5Config.colorScanningNewCount ?? entry.a5Config.colorScanningNewCount;
        }

        if (pendingAmount) entry.pendingAmount = pendingAmount;
        if (tdsAmount) entry.tdsAmount = tdsAmount;
        if (paymentAmountType) entry.paymentAmountType = paymentAmountType;
        if (paymentAmount) entry.paymentAmount = paymentAmount;
        entry.companyId = companyId || entry.companyId;
        entry.invoiceLink = invoiceLink || entry.invoiceLink;
        entry.invoiceType = invoiceType || entry.invoiceType;
        entry.invoiceNumber = invoiceNumber || entry.invoiceNumber;
        entry.countImageUpload = countImageUploadUrl;
        if (staus) entry.staus = staus;
        entry.modeOfPayment = modeOfPayment ?? entry.modeOfPayment;
        entry.bankName = bankName ?? entry.bankName;
        entry.transactionDetails = transactionDetails ?? entry.transactionDetails;
        entry.chequeDate = chequeDate ?? entry.chequeDate;
        entry.transferDate = transferDate ?? entry.transferDate;
        entry.companyNamePayment = companyNamePayment ?? entry.companyNamePayment;
        entry.otherPaymentMode = otherPaymentMode ?? entry.otherPaymentMode;

        // 🧮 Calculate grand total
        const a3Total = entry.a3Config
            ? ((entry.a3Config.bwNewCount - entry.a3Config.bwOldCount) +
                (entry.a3Config.colorNewCount - entry.a3Config.colorOldCount) +
                (entry.a3Config.colorScanningNewCount - entry.a3Config.colorScanningOldCount))
            : 0;

        const a4Total = entry.a4Config
            ? ((entry.a4Config.bwNewCount - entry.a4Config.bwOldCount) +
                (entry.a4Config.colorNewCount - entry.a4Config.colorOldCount) +
                (entry.a4Config.colorScanningNewCount - entry.a4Config.colorScanningOldCount))
            : 0;

        const a5Total = entry.a5Config
            ? ((entry.a5Config.bwNewCount - entry.a5Config.bwOldCount) +
                (entry.a5Config.colorNewCount - entry.a5Config.colorOldCount) +
                (entry.a5Config.colorScanningNewCount - entry.a5Config.colorScanningOldCount))
            : 0;

        const totalBeforeTDS = a3Total + a4Total + a5Total;
        const tds = parseFloat(entry.tdsAmount) || 0;

        entry.grandTotal = (tds - totalBeforeTDS).toFixed(2);

        await entry.save();

        const populatedInvoice = await RentalPaymentEntry.findById(id)
            .populate('companyId')
            .populate({
                path: 'machineId',
                populate: {
                    path: 'gstType',
                },
            })
            .populate('assignedTo');

        res.status(200).send({
            success: true,
            message: 'Rental Payment Entry updated successfully',
            entry: populatedInvoice,
        });

    } catch (error) {
        console.error("Error in updateRentalPaymentEntry:", error);
        res.status(500).send({
            success: false,
            message: 'Error in updating rental payment entry',
            error,
        });
    }
};


// You might also need a way to get "Send Details To" options.
// For now, I'll assume a hardcoded list or fetch from a separate model if it exists.
export const getSendDetailsToOptions = async (req, res) => {
    try {
        // In a real application, these might come from a database or configuration
        const options = ["Email", "WhatsApp", "Physical Copy", "Other"];
        res.status(200).send({ success: true, options });
    } catch (error) {
        console.error("Error in getSendDetailsToOptions:", error);
        res.status(500).send({ success: false, message: 'Error fetching send details options', error });
    }
};