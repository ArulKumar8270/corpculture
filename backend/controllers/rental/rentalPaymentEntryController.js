import RentalPaymentEntry from "../../models/rentalPaymentEntryModel.js";
import cloudinary from "cloudinary";

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
            rentalId
        } = req.body;

        // {{ edit_1 }}
        // Parse the JSON strings for config objects
        const a3Config = req.body.a3Config ? JSON.parse(req.body.a3Config) : {};
        const a4Config = req.body.a4Config ? JSON.parse(req.body.a4Config) : {};
        const a5Config = req.body.a5Config ? JSON.parse(req.body.a5Config) : {};
        // {{ edit_1 }}

        // Basic Validation
        // {{ edit_2 }}
        // Expanded validation to include new required fields if necessary,
        // for now, keeping it focused on bwNewCount as per previous logic.
        // You might want to add validation for colorNewCount and colorScanningNewCount here if they are mandatory.
        if (!machineId || !sendDetailsTo || !a4Config || a4Config.bwNewCount === undefined) {
            return res.status(400).send({ success: false, message: 'Missing required fields (machineId, sendDetailsTo, a4Config.bwNewCount).' });
        }
        // {{ edit_2 }}


        const result = await cloudinary.v2.uploader.upload(countImageUpload, {
            folder: "rental_payment_entries",
        });
        const countImageUploadUrl = {
            public_id: result.public_id,
            url: result.secure_url,
        };

        const newEntry = new RentalPaymentEntry({
            machineId,
            invoiceNumber,
            rentalId,
            companyId: companyId, // Get companyId from the machine
            sendDetailsTo,
            countImageUpload: countImageUploadUrl,
            assignedTo,
            invoiceType,
            remarks,
            // {{ edit_3 }}
            a3Config, // These now include the new fields due to JSON.parse
            a4Config,
            a5Config,
            // {{ edit_3 }}
        });

        await newEntry.save();
        res.status(201).send({ success: true, message: 'Rental Payment Entry created successfully', entry: newEntry });

    } catch (error) {
        console.error("Error in createRentalPaymentEntry:", error);
        res.status(500).send({ success: false, message: 'Error in creating rental payment entry', error });
    }
};

// Get all rental payment entries
export const getAllRentalPaymentEntries = async (req, res) => {
    try {
        const { invoiceType } = req.params; // Get invoiceType from query parameters
        let query = {};

        if (invoiceType) {
            query.invoiceType = invoiceType; // Add invoiceType to the query if provided
        }
        const entries = await RentalPaymentEntry.find(query)
            .populate({
                path: 'machineId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate('companyId') // Populate company name
            .populate('assignedTo') // Populate product details // Populate company details
            .sort({ createdAt: -1 });

        res.status(200).send({
            success: true,
            message: 'All rental payment entries fetched successfully',
            entries
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
            query = { invoiceType, assignedTo };
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
            // {{ edit_1 }}
            modeOfPayment,
            bankName,
            transactionDetails,
            chequeDate,
            transferDate,
            companyNamePayment,
            otherPaymentMode,
            invoiceLink,
            invoiceType,
            rentalId
            // {{ edit_1 }}
        } = req.body;

        // Parse the JSON strings for config objects
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
            // Delete old image from cloudinary if it exists
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
        // Update nested config objects, merging new values with existing ones
        if (a3Config) {
            entry.a3Config.bwOldCount = a3Config.bwOldCount !== undefined ? a3Config.bwOldCount : entry.a3Config.bwOldCount;
            entry.a3Config.bwNewCount = a3Config.bwNewCount !== undefined ? a3Config.bwNewCount : entry.a3Config.bwNewCount;
            entry.a3Config.colorOldCount = a3Config.colorOldCount !== undefined ? a3Config.colorOldCount : entry.a3Config.colorOldCount;
            entry.a3Config.colorNewCount = a3Config.colorNewCount !== undefined ? a3Config.colorNewCount : entry.a3Config.colorNewCount;
            entry.a3Config.colorScanningOldCount = a3Config.colorScanningOldCount !== undefined ? a3Config.colorScanningOldCount : entry.a3Config.colorScanningOldCount;
            entry.a3Config.colorScanningNewCount = a3Config.colorScanningNewCount !== undefined ? a3Config.colorScanningNewCount : entry.a3Config.colorScanningNewCount;
        }
        if (a4Config) {
            entry.a4Config.bwOldCount = a4Config.bwOldCount !== undefined ? a4Config.bwOldCount : entry.a4Config.bwOldCount;
            entry.a4Config.bwNewCount = a4Config.bwNewCount !== undefined ? a4Config.bwNewCount : entry.a4Config.bwNewCount;
            entry.a4Config.colorOldCount = a4Config.colorOldCount !== undefined ? a4Config.colorOldCount : entry.a4Config.colorOldCount;
            entry.a4Config.colorNewCount = a4Config.colorNewCount !== undefined ? a4Config.colorNewCount : entry.a4Config.colorNewCount;
            entry.a4Config.colorScanningOldCount = a4Config.colorScanningOldCount !== undefined ? a4Config.colorScanningOldCount : entry.a4Config.colorScanningOldCount;
            entry.a4Config.colorScanningNewCount = a4Config.colorScanningNewCount !== undefined ? a4Config.colorScanningNewCount : entry.a4Config.colorScanningNewCount;
        }
        if (a5Config) {
            entry.a5Config.bwOldCount = a5Config.bwOldCount !== undefined ? a5Config.bwOldCount : entry.a5Config.bwOldCount;
            entry.a5Config.bwNewCount = a5Config.bwNewCount !== undefined ? a5Config.bwNewCount : entry.a5Config.bwNewCount;
            entry.a5Config.colorOldCount = a5Config.colorOldCount !== undefined ? a5Config.colorOldCount : entry.a5Config.colorOldCount;
            entry.a5Config.colorNewCount = a5Config.colorNewCount !== undefined ? a5Config.colorNewCount : entry.a5Config.colorNewCount;
            entry.a5Config.colorScanningOldCount = a5Config.colorScanningOldCount !== undefined ? a5Config.colorScanningOldCount : entry.a5Config.colorScanningOldCount;
            entry.a5Config.colorScanningNewCount = a5Config.colorScanningNewCount !== undefined ? a5Config.colorScanningNewCount : entry.a5Config.colorScanningNewCount;
        }
        entry.companyId = companyId || entry.companyId;
        entry.invoiceLink = invoiceLink || entry.invoiceLink;
        entry.invoiceType = invoiceType || entry.invoiceType;
        entry.rentalId = rentalId || entry.rentalId;
        entry.invoiceNumber = invoiceNumber || entry.invoiceNumber;
        entry.countImageUpload = countImageUploadUrl;
        // {{ edit_2 }}
        entry.modeOfPayment = modeOfPayment !== undefined ? modeOfPayment : entry.modeOfPayment;
        entry.bankName = bankName !== undefined ? bankName : entry.bankName;
        entry.transactionDetails = transactionDetails !== undefined ? transactionDetails : entry.transactionDetails;
        entry.chequeDate = chequeDate !== undefined ? chequeDate : entry.chequeDate;
        entry.transferDate = transferDate !== undefined ? transferDate : entry.transferDate;
        entry.companyNamePayment = companyNamePayment !== undefined ? companyNamePayment : entry.companyNamePayment;
        entry.otherPaymentMode = otherPaymentMode !== undefined ? otherPaymentMode : entry.otherPaymentMode;
        // {{ edit_2 }}

        await entry.save();

        res.status(200).send({ success: true, message: 'Rental Payment Entry updated successfully', entry });

    } catch (error) {
        console.error("Error in updateRentalPaymentEntry:", error);
        res.status(500).send({ success: false, message: 'Error in updating rental payment entry', error });
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