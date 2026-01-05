import RentalPaymentEntry from "../../models/rentalPaymentEntryModel.js";
import cloudinary from "cloudinary";
import rentalProductModel from "../../models/rentalProductModel.js";
import Company from "../../models/companyModel.js";

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

// Helper to calculate product total
const calculateProductTotal = (machine, a3Config, a4Config, a5Config) => {
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

    // Commission (machine-level)
    const commissionRate = parseFloat(machine.commission || 0);
    const commissionAmount = (totalWithGST * commissionRate) / 100;

    return totalWithGST + commissionAmount;
};

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
            status,
            products: productsRaw, // New: array of products (may be JSON string from FormData)
        } = req.body;
        // Parse products if it's a JSON string (from FormData)
        let products = null;
        if (productsRaw) {
            try {
                products = typeof productsRaw === 'string' ? JSON.parse(productsRaw) : productsRaw;
            } catch (parseError) {
                console.error("Error parsing products JSON:", parseError);
                return res.status(400).send({
                    success: false,
                    message: "Invalid products format. Expected JSON array.",
                });
            }
        }

        // Basic validation - check if fields exist and are not empty strings
        const hasCompanyId = companyId && companyId.toString().trim() !== '';
        const hasSendDetailsTo = sendDetailsTo && sendDetailsTo.toString().trim() !== '';

        if (!hasSendDetailsTo || !hasCompanyId) {
            return res.status(400).send({
                success: false,
                message: "Missing required fields (sendDetailsTo, companyId)",
                received: {
                    companyId: companyId || 'missing',
                    sendDetailsTo: sendDetailsTo || 'missing'
                }
            });
        }

        // Check if using new format (products array) or old format (single machineId)
        const isMultipleProducts = products && Array.isArray(products) && products.length > 0;
        const isSingleProduct = machineId && !isMultipleProducts;

        if (!isMultipleProducts && !isSingleProduct) {
            return res.status(400).send({
                success: false,
                message: "Either machineId or products array is required",
            });
        }

        let grandTotal = 0;
        let productsArray = [];
        let countImageUploadUrl = null;

        // Handle single product (backward compatibility)
        if (isSingleProduct) {
            // Parse config JSON strings
            const a3Config = req.body.a3Config ? JSON.parse(req.body.a3Config) : {};
            const a4Config = req.body.a4Config ? JSON.parse(req.body.a4Config) : {};
            const a5Config = req.body.a5Config ? JSON.parse(req.body.a5Config) : {};

            // Upload count image if provided
            if (countImageUpload) {
                const result = await cloudinary.v2.uploader.upload(countImageUpload, {
                    folder: "rental_payment_entries",
                });
                countImageUploadUrl = {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            }

            // Fetch machine details
            const machine = await rentalProductModel.findById(machineId).populate("gstType");
            if (!machine) {
                return res.status(404).send({
                    success: false,
                    message: "Rental product not found",
                });
            }

            const productTotal = calculateProductTotal(machine, a3Config, a4Config, a5Config);
            grandTotal = productTotal;

            // Create entry with old format
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
                status: status || 'Unpaid',
            });

            await newEntry.save();

            const populatedInvoice = await RentalPaymentEntry.findById(newEntry._id)
                .populate("companyId")
                .populate("machineId")
                .populate("assignedTo")
                .populate("machineId.gstType");

            return res.status(201).send({
                success: true,
                message: "Rental Payment Entry created successfully",
                entry: populatedInvoice,
            });
        }

        // Handle multiple products (new format)
        if (isMultipleProducts) {
            // Process each product
            for (const productData of products) {
                const {
                    machineId: prodMachineId,
                    serialNo,
                    a3Config: prodA3Config,
                    a4Config: prodA4Config,
                    a5Config: prodA5Config,
                    countImageUpload: prodCountImageUpload,
                } = productData;

                if (!prodMachineId) {
                    return res.status(400).send({
                        success: false,
                        message: "machineId is required for each product",
                    });
                }

                // Fetch machine details
                const machine = await rentalProductModel.findById(prodMachineId).populate("gstType");
                if (!machine) {
                    return res.status(404).send({
                        success: false,
                        message: `Rental product not found for machineId: ${prodMachineId}`,
                    });
                }

                // Parse configs if they are strings
                const a3Config = typeof prodA3Config === 'string' ? JSON.parse(prodA3Config) : (prodA3Config || {});
                const a4Config = typeof prodA4Config === 'string' ? JSON.parse(prodA4Config) : (prodA4Config || {});
                const a5Config = typeof prodA5Config === 'string' ? JSON.parse(prodA5Config) : (prodA5Config || {});

                // Calculate product total
                const productTotal = calculateProductTotal(machine, a3Config, a4Config, a5Config);

                // Upload product image if provided
                let productImageUrl = null;
                if (prodCountImageUpload) {
                    const result = await cloudinary.v2.uploader.upload(prodCountImageUpload, {
                        folder: "rental_payment_entries",
                    });
                    productImageUrl = {
                        public_id: result.public_id,
                        url: result.secure_url,
                    };
                }

                // Add to products array
                productsArray.push({
                    machineId: prodMachineId,
                    serialNo: serialNo || machine.serialNo,
                    a3Config,
                    a4Config,
                    a5Config,
                    countImageUpload: productImageUrl,
                    productTotal: parseFloat(productTotal.toFixed(2)),
                });

                grandTotal += productTotal;
            }

            // Upload main count image if provided (for backward compatibility)
            if (countImageUpload) {
                const result = await cloudinary.v2.uploader.upload(countImageUpload, {
                    folder: "rental_payment_entries",
                });
                countImageUploadUrl = {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            }

            // Create new entry with products array
            const newEntry = new RentalPaymentEntry({
                products: productsArray,
                invoiceNumber,
                rentalId,
                companyId,
                sendDetailsTo,
                countImageUpload: countImageUploadUrl,
                assignedTo,
                invoiceType,
                remarks,
                status: status || 'Unpaid',
                grandTotal: grandTotal.toFixed(2),
            });

            await newEntry.save();

            const populatedInvoice = await RentalPaymentEntry.findById(newEntry._id)
                .populate("companyId")
                .populate("assignedTo")
                .populate({
                    path: "products.machineId",
                    populate: {
                        path: "gstType",
                    },
                });

            return res.status(201).send({
                success: true,
                message: "Rental Payment Entry created successfully with multiple products",
                entry: populatedInvoice,
            });
        }

    } catch (error) {
        console.error("Error in createRentalPaymentEntry:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating rental payment entry",
            error: error.message,
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
                path: 'machineId', // First populate productId (old format)
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate({
                path: 'products.machineId', // Populate machineId in products array (new format)
                populate: {
                    path: 'gstType',        // Then populate gstType inside each product
                }
            })
            .populate('companyId') // Populate company name
            .populate('assignedTo') // Populate assigned user
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
                path: 'machineId', // Populate single machineId (old format)
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })
            .populate({
                path: 'products.machineId', // Populate machineId in products array (new format)
                populate: {
                    path: 'gstType',        // Then populate gstType inside each product
                }
            })
            .populate('companyId') // Populate company name
            .populate('assignedTo') // Populate assigned user

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

        const entries = await RentalPaymentEntry.find(query)
            .populate({
                path: 'machineId', // First populate productId (old format)
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate({
                path: 'products.machineId', // Populate machineId in products array (new format)
                populate: {
                    path: 'gstType',        // Then populate gstType inside each product
                }
            })
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
            status,
            assignedTo,
            products: productsRaw, // New: array of products (may be JSON string from FormData)
        } = req.body;

        let entry = await RentalPaymentEntry.findById(id);

        if (!entry) {
            return res.status(404).send({ success: false, message: 'Rental Payment Entry not found.' });
        }

        // Parse products if it's a JSON string (from FormData)
        let products = null;
        if (productsRaw) {
            try {
                products = typeof productsRaw === 'string' ? JSON.parse(productsRaw) : productsRaw;
            } catch (parseError) {
                console.error("Error parsing products JSON:", parseError);
                return res.status(400).send({
                    success: false,
                    message: "Invalid products format. Expected JSON array.",
                });
            }
        }

        // Check if using new format (products array) or old format (single machineId)
        const isMultipleProducts = products && Array.isArray(products) && products.length > 0;
        const isSingleProduct = machineId && !isMultipleProducts;

        let grandTotal = 0;

        // Handle multiple products (new format)
        if (isMultipleProducts) {
            const productsArray = [];
            
            // Process each product
            for (const productData of products) {
                const {
                    machineId: prodMachineId,
                    serialNo,
                    a3Config: prodA3Config,
                    a4Config: prodA4Config,
                    a5Config: prodA5Config,
                    countImageUpload: prodCountImageUpload,
                } = productData;

                if (!prodMachineId) {
                    return res.status(400).send({
                        success: false,
                        message: "machineId is required for each product",
                    });
                }

                // Fetch machine details
                const machine = await rentalProductModel.findById(prodMachineId).populate("gstType");
                if (!machine) {
                    return res.status(404).send({
                        success: false,
                        message: `Rental product not found for machineId: ${prodMachineId}`,
                    });
                }

                // Parse configs if they are strings
                const a3Config = typeof prodA3Config === 'string' ? JSON.parse(prodA3Config) : (prodA3Config || {});
                const a4Config = typeof prodA4Config === 'string' ? JSON.parse(prodA4Config) : (prodA4Config || {});
                const a5Config = typeof prodA5Config === 'string' ? JSON.parse(prodA5Config) : (prodA5Config || {});

                // Calculate product total
                const productTotal = calculateProductTotal(machine, a3Config, a4Config, a5Config);

                // Handle product image upload if provided
                let productImageUrl = null;
                if (prodCountImageUpload) {
                    // Check if this product already has an image in the entry
                    const existingProduct = entry.products?.find(p => 
                        p.machineId?.toString() === prodMachineId || p.machineId === prodMachineId
                    );
                    
                    // Delete old image if exists
                    if (existingProduct?.countImageUpload?.public_id) {
                        try {
                            await cloudinary.v2.uploader.destroy(existingProduct.countImageUpload.public_id);
                        } catch (destroyError) {
                            console.error("Error destroying old product image:", destroyError);
                        }
                    }

                    // Upload new image
                    const result = await cloudinary.v2.uploader.upload(prodCountImageUpload, {
                        folder: "rental_payment_entries",
                    });
                    productImageUrl = {
                        public_id: result.public_id,
                        url: result.secure_url,
                    };
                } else {
                    // Keep existing image if no new one provided
                    const existingProduct = entry.products?.find(p => 
                        p.machineId?.toString() === prodMachineId || p.machineId === prodMachineId
                    );
                    if (existingProduct?.countImageUpload) {
                        productImageUrl = existingProduct.countImageUpload;
                    }
                }

                // Add to products array
                productsArray.push({
                    machineId: prodMachineId,
                    serialNo: serialNo || machine.serialNo,
                    a3Config,
                    a4Config,
                    a5Config,
                    countImageUpload: productImageUrl,
                    productTotal: parseFloat(productTotal.toFixed(2)),
                });

                grandTotal += productTotal;
            }

            // Update products array
            entry.products = productsArray;
            entry.grandTotal = grandTotal.toFixed(2);
        }
        // Handle single product (old format - backward compatibility)
        else if (isSingleProduct) {
            const a3Config = req.body.a3Config ? JSON.parse(req.body.a3Config) : undefined;
            const a4Config = req.body.a4Config ? JSON.parse(req.body.a4Config) : undefined;
            const a5Config = req.body.a5Config ? JSON.parse(req.body.a5Config) : undefined;

            // Update machineId
            entry.machineId = machineId || entry.machineId;

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

            // Recalculate grand total for single product
            const machine = await rentalProductModel.findById(machineId).populate("gstType");
            if (machine) {
                const productTotal = calculateProductTotal(machine, entry.a3Config, entry.a4Config, entry.a5Config);
                entry.grandTotal = productTotal.toFixed(2);
            }
        }

        // Handle main count image upload if provided (optional - for backward compatibility)
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

        // Update other fields
        if (sendDetailsTo) entry.sendDetailsTo = sendDetailsTo;
        if (remarks !== undefined) entry.remarks = remarks;
        if (pendingAmount) entry.pendingAmount = pendingAmount;
        if (tdsAmount) entry.tdsAmount = tdsAmount;
        if (paymentAmountType) entry.paymentAmountType = paymentAmountType;
        if (paymentAmount) entry.paymentAmount = paymentAmount;
        if (companyId) entry.companyId = companyId;
        if (invoiceLink) entry.invoiceLink = invoiceLink;
        if (invoiceType) entry.invoiceType = invoiceType;
        if (invoiceNumber) entry.invoiceNumber = invoiceNumber;
        entry.countImageUpload = countImageUploadUrl;
        if (status) entry.status = status;
        if (modeOfPayment !== undefined) entry.modeOfPayment = modeOfPayment;
        if (bankName !== undefined) entry.bankName = bankName;
        if (transactionDetails !== undefined) entry.transactionDetails = transactionDetails;
        if (chequeDate !== undefined) entry.chequeDate = chequeDate;
        if (transferDate !== undefined) entry.transferDate = transferDate;
        if (companyNamePayment !== undefined) entry.companyNamePayment = companyNamePayment;
        if (otherPaymentMode !== undefined) entry.otherPaymentMode = otherPaymentMode;
        if (assignedTo) entry.assignedTo = assignedTo;

        await entry.save();

        // Populate the entry with all necessary data
        const populatedInvoice = await RentalPaymentEntry.findById(id)
            .populate('companyId')
            .populate({
                path: 'machineId', // For old format
                populate: {
                    path: 'gstType',
                },
            })
            .populate({
                path: 'products.machineId', // For new format
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
            error: error.message,
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