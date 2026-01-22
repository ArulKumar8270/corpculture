import ServiceInvoice from "../../models/serviceInvoiceModel.js";
import Company from "../../models/companyModel.js"; // Assuming Company model path
import ServiceProduct from "../../models/serviceProductModel.js"; // Assuming ServiceProduct model path
import Material from "../../models/materialModel.js"; // Import Material model for reducing units
import cloudinary from "cloudinary";
import CommonDetails from "../../models/commonDetailsModel.js";
// Helper function to calculate totals
const calculateInvoiceTotals = (products) => {
    let subtotal = 0;
    for (const item of products) {
        subtotal += item.totalAmount;
    }
    // For simplicity, tax is assumed to be 0 for now or handled externally.
    // You can add tax calculation logic here if needed.
    const tax = 0; // Example: subtotal * 0.05 for 5% tax
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
};

// Helper function to generate invoice number based on format
// Preserves the format structure (year, prefix, etc.) and only replaces the sequential number part
const generateInvoiceNumber = (invoiceCount, format) => {
    if (!format || format.trim() === '') {
        return invoiceCount.toString();
    }

    // DO NOT replace year patterns - preserve them as-is from the format template
    // The format template (e.g., "CC/23-24/00001") should be used as-is, only the number part changes
    
    // Extract the last number sequence (sequential number part) from the original format
    const lastNumberMatch = format.match(/(\d+)(?!.*\d)/);
    
    if (lastNumberMatch) {
        // Get the number of digits in the template (e.g., "00001" has 5 digits)
        const numberDigits = lastNumberMatch[1].length;
        // Get the prefix (everything before the last number sequence)
        const prefix = format.substring(0, format.lastIndexOf(lastNumberMatch[1]));
        // Format the invoice count with the same number of digits (e.g., 6 → "00006")
        const formattedNumber = invoiceCount.toString().padStart(numberDigits, '0');
        // Return prefix + formatted number (e.g., "CC/23-24/" + "00006" = "CC/23-24/00006")
        return prefix + formattedNumber;
    }
    
    // Fallback: append count to format if no number pattern found
    return format + invoiceCount.toString().padStart(5, '0');
};

// Create Service Invoice
export const createServiceInvoice = async (req, res) => {
    try {
        const {
            // invoiceNumber: providedInvoiceNumber, // IGNORED - backend generates from global count only
            companyId,
            products, // Array of { productId, quantity, rate }
            modeOfPayment,
            bankName, // New field
            transactionDetails, // New field
            chequeDate, // New field
            transferDate, // New field
            companyNamePayment, // New field
            otherPaymentMode, // New field
            deliveryAddress,
            reference,
            description,
            tax, // Optional tax from frontend, or calculated here
            invoiceDate,
            quotationDate, // Date when quotation was created
            movedToInvoiceDate, // Date when quotation was moved to invoice
            assignedTo,
            sendTo,
            invoiceType,
            serviceId,
            paymentAmount
        } = req.body;


        // Basic Validation
        if (!companyId || !products || products.length === 0 || !modeOfPayment || !deliveryAddress) {
            return res.status(400).send({ success: false, message: 'Missing required fields: companyId, products, modeOfPayment, deliveryAddress.' });
        }

        // ============================================
        // CRITICAL: ALWAYS generate invoice number from GLOBAL COUNT ONLY
        // ============================================
        // We NEVER use existing invoice numbers to determine the next number
        // We NEVER query the database for existing invoices
        // The global count in CommonDetails is the ABSOLUTE source of truth
        // ============================================
        
        let invoiceNumber = null;
        let nextInvoiceCount = null; // Store this for later use in increment
        
        if (invoiceType !== 'quotation') {
            console.log(`[Invoice Generation] ===== STARTING INVOICE NUMBER GENERATION =====`);
            console.log(`[Invoice Generation] Request body invoiceType: ${invoiceType}`);
            console.log(`[Invoice Generation] Request body invoiceNumber (if any): ${req.body.invoiceNumber || 'NONE - GOOD!'}`);
            
            // Fetch global invoice count and format
            const commonDetails = await CommonDetails.findOne({});
            
            if (!commonDetails) {
                console.error(`[Invoice Generation] ERROR: Global invoice settings not found!`);
                return res.status(500).send({ success: false, message: 'Global invoice settings not found. Please configure invoice settings first.' });
            }

            const globalFormat = commonDetails.globalInvoiceFormat || '';
            
            // Use the stored invoiceCount from DB (this is the actual current count)
            // The format is just a template - we preserve its structure (year, prefix) but use DB count
            let currentCount = typeof commonDetails.invoiceCount === 'number' 
                ? commonDetails.invoiceCount 
                : parseInt(commonDetails.invoiceCount) || 0;
            
            console.log(`[Invoice Generation] Using stored invoiceCount from DB: ${currentCount}`);
            console.log(`[Invoice Generation] Global format template: "${globalFormat}"`);
            console.log(`[Invoice Generation] Format will be preserved (year, prefix) - only number will be replaced`);
            
            // Use currentCount + 1 for the next invoice number
            // The format structure (year, prefix) will be preserved, only the number part changes
            nextInvoiceCount = currentCount + 1;
            
            // Generate invoice number from global count and format ONLY
            invoiceNumber = generateInvoiceNumber(nextInvoiceCount, globalFormat);
            
            console.log(`[Invoice Generation] ===== USING GLOBAL COUNT ONLY =====`);
            console.log(`[Invoice Generation] Global count from DB: ${currentCount}`);
            console.log(`[Invoice Generation] Next count (currentCount + 1): ${nextInvoiceCount}`);
            console.log(`[Invoice Generation] Global format: ${globalFormat}`);
            console.log(`[Invoice Generation] Generated invoice number: ${invoiceNumber}`);
            console.log(`[Invoice Generation] NOT checking existing invoices - using global count only`);
            console.log(`[Invoice Generation] ===== END INVOICE NUMBER GENERATION =====`);

            // CRITICAL: We IGNORE any invoice number provided by the frontend
            // We ONLY use the global count to generate invoice numbers
            // We NEVER query existing invoices to determine the next number
            // The global count is the ABSOLUTE source of truth
        } else {
            console.log(`[Invoice Generation] This is a quotation - no invoice number needed`);
        }
        // Validate Company
        const existingCompany = await Company.findById(companyId);
        if (!existingCompany) {
            return res.status(404).send({ success: false, message: 'Company not found.' });
        }

        // Validate Products and calculate line item totals
        const processedProducts = [];

        for (const item of products) {
            if (!item.productId || !item.quantity || item.rate === undefined) {
                return res.status(400).send({ success: false, message: 'Each product must have productId, quantity, and rate.' });
            }
            if (isNaN(item.quantity) || item.quantity <= 0) {
                return res.status(400).send({ success: false, message: `Invalid quantity for product ${item.productId}.` });
            }
            if (isNaN(item.rate) || item.rate < 0) {
                return res.status(400).send({ success: false, message: `Invalid rate for product ${item.productId}.` });
            }

            const serviceProduct = await ServiceProduct.findById(item.productId);
            if (!serviceProduct) {
                return res.status(404).send({ success: false, message: `Product with ID ${item.productId} not found.` });
            }

            processedProducts.push({
                productId: item.productId,
                productName: serviceProduct.productName, // Store product name from fetched product
                quantity: item.quantity,
                rate: item.rate,
                totalAmount: item.totalAmount,
            });
        }

        const { subtotal, grandTotal } = calculateInvoiceTotals(processedProducts);

        // Build invoice object, only include assignedTo if it's a valid value
        // CRITICAL: invoiceNumber is generated ONLY from global count, never from existing invoices
        const invoiceData = {
            invoiceNumber, // Generated from global count only
            companyId,
            products: processedProducts,
            modeOfPayment,
            bankName, // Save new field
            transactionDetails, // Save new field
            chequeDate, // Save new field
            transferDate, // Save new field
            companyNamePayment, // Save new field
            otherPaymentMode, // Save new field
            deliveryAddress,
            reference,
            description,
            subtotal,
            tax: tax || 0, // Use provided tax or default to 0
            grandTotal,
            invoiceDate: invoiceDate || Date.now(),
            quotationDate: invoiceType === 'quotation' ? (quotationDate || invoiceDate || Date.now()) : quotationDate, // Set quotationDate if creating a quotation
            movedToInvoiceDate: movedToInvoiceDate, // Set when moving from quotation to invoice
            sendTo,
            invoiceType,
            serviceId,
            paymentAmount
        };

        // Only include assignedTo if it's a valid value (not undefined, null, or empty string)
        if (assignedTo && assignedTo !== 'undefined' && assignedTo !== 'null' && assignedTo.trim() !== '') {
            invoiceData.assignedTo = assignedTo;
        }

        const newServiceInvoice = new ServiceInvoice(invoiceData);

        await newServiceInvoice.save();

        // Increment global invoice count if invoice was created (not quotation)
        // This ensures the count is incremented after successful invoice creation
        // IMPORTANT: This increment happens AFTER the invoice is saved, using the count that was used to generate the invoice
        if (invoiceType !== 'quotation' && invoiceNumber && nextInvoiceCount !== null) {
            try {
                console.log(`[Invoice Generation] ===== INCREMENTING GLOBAL INVOICE COUNT =====`);
                console.log(`[Invoice Generation] Before increment: Count should be ${nextInvoiceCount - 1}`);
                console.log(`[Invoice Generation] After increment: Count should be ${nextInvoiceCount}`);
                
                // CRITICAL: Use atomic increment to prevent race conditions
                // This MUST increment the global count by 1
                const beforeIncrement = nextInvoiceCount - 1;
                const updatedDetails = await CommonDetails.findOneAndUpdate(
                    {},
                    { $inc: { invoiceCount: 1 } },
                    { new: true, upsert: true }
                );
                
                const actualNewCount = updatedDetails?.invoiceCount || 0;
                
                console.log(`[Invoice Generation] Invoice count incremented successfully!`);
                console.log(`[Invoice Generation] Before increment: ${beforeIncrement}`);
                console.log(`[Invoice Generation] Expected after increment: ${nextInvoiceCount}`);
                console.log(`[Invoice Generation] Actual new count from DB: ${actualNewCount}`);
                console.log(`[Invoice Generation] Invoice number: ${invoiceNumber}`);
                console.log(`[Invoice Generation] ===== END INCREMENT =====`);
                
                // Verify the count matches what we expect
                if (actualNewCount !== nextInvoiceCount) {
                    console.error(`[Invoice Generation] ERROR: Count mismatch! Expected: ${nextInvoiceCount}, Actual: ${actualNewCount}`);
                    console.error(`[Invoice Generation] This indicates the increment may have failed or been overridden!`);
                } else {
                    console.log(`[Invoice Generation] ✓ SUCCESS: Count incremented correctly from ${beforeIncrement} to ${actualNewCount}`);
                }
                
                // Double-check by fetching the count again to ensure it persisted
                const verifyDetails = await CommonDetails.findOne({});
                if (verifyDetails && verifyDetails.invoiceCount !== actualNewCount) {
                    console.error(`[Invoice Generation] CRITICAL: Count verification failed! Expected: ${actualNewCount}, Found in DB: ${verifyDetails.invoiceCount}`);
                } else {
                    console.log(`[Invoice Generation] ✓ Verification: Count persisted correctly in DB: ${verifyDetails?.invoiceCount}`);
                }
            } catch (error) {
                console.error('[Invoice Generation] CRITICAL ERROR incrementing invoice count:', error);
                console.error('[Invoice Generation] Error details:', error.message);
                console.error('[Invoice Generation] Stack:', error.stack);
                // This is critical - if count increment fails, the system will be out of sync
                // Consider rolling back the invoice creation or alerting admin
            }
        } else {
            console.log(`[Invoice Generation] Skipping count increment - invoiceType: ${invoiceType}, invoiceNumber: ${invoiceNumber}, nextInvoiceCount: ${nextInvoiceCount}`);
        }

        // Fetch the newly created invoice and populate necessary fields
        const populatedInvoice = await ServiceInvoice.findById(newServiceInvoice._id)
            .populate('companyId') // Populate company details
            .populate({
                path: 'products.productId', // Populate product details
                populate: [
                    {
                        path: 'gstType',        // Then populate gstType inside the product
                    },
                    {
                        path: 'productName',    // Populate productName (Material) inside the product
                        // Material model doesn't have nested productName, so no further populate needed
                    }
                ]
            })
            .populate('assignedTo'); // Populate assignedTo user details

        res.status(201).send({ success: true, message: 'Service Invoice created successfully', serviceInvoice: populatedInvoice });

    } catch (error) {
        console.error("Error in createServiceInvoice:", error);
        res.status(500).send({ success: false, message: 'Error in creating service invoice', error });
    }
};

// Get All Service Invoices
export const getAllServiceInvoices = async (req, res) => {
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
            status, // Add status filter
            ...otherFilters // Catch any other direct filters
        } = req.body;

        let query = {};

        if (status) {
            query.status = status;
        }
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
            query.invoiceDate = {};
            if (fromDate) {
                query.invoiceDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.invoiceDate.$lte = endOfDay;
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
        const totalCount = await ServiceInvoice.countDocuments(query);

        const serviceInvoices = await ServiceInvoice.find(query)
            .populate({
                path: "products.productId",
                populate: [
                    {
                        path: "gstType", // populate gstType inside productId
                    },
                    {
                        path: "productName", // populate productName (Material) inside productId
                        // Material model doesn't have nested productName, so no further populate needed
                    },
                ],
            })
            .populate('companyId')
            .populate('assignedTo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).send({
            success: true,
            message: 'All service invoices fetched',
            serviceInvoices,
            totalCount // Send total count for frontend pagination
        });
    } catch (error) {
        console.error("Error in getAllServiceInvoices:", error);
        res.status(500).send({ success: false, message: 'Error in getting all service invoices', error });
    }
};


// Get Service Invoices by assignedTo
export const getServiceInvoicesAssignedTo = async (req, res) => {
    try {
        const { assignedTo, invoiceType } = req.params; // Assuming phone is passed as a URL parameter

        if (!assignedTo) {
            return res.status(400).send({
                success: false,
                message: "assignedTo is required",
                errorType: "missingParameter"
            });
        }

        let query = {};
        if (invoiceType && assignedTo) {
            query = { invoiceType, assignedTo, tdsAmount: { $eq: null } };
        }
        const serviceInvoices = await ServiceInvoice.find(query)
            .populate('companyId') // Populate company name
            .populate({
                path: "products.productId",
                populate: [
                    {
                        path: "gstType", // populate gstType inside productId
                    },
                    {
                        path: "productName", // populate productName (Material) inside productId
                        // Material model doesn't have nested productName, so no further populate needed
                    },
                ],
            })
            .populate('assignedTo') // Populate product details
            .sort({ createdAt: -1 }); // Find services by phone number

        if (!serviceInvoices || serviceInvoices.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No ServiceInvoice found for this phone number",
                errorType: "servicesNotFound"
            });
        }

        res.status(200).send({
            success: true,
            serviceInvoices
        });
    } catch (error) {
        console.error("Error in getting ServiceInvoice by phone:", error); // Log the error
        res.status(500).send({
            success: false,
            message: "Error in getting services by phone",
            error
        });
    }
};

// Get Single Service Invoice by ID
export const getServiceInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const serviceInvoice = await ServiceInvoice.findById(id)
            .populate('companyId') // Populate company name
            .populate({
                path: "products.productId",
                populate: [
                    {
                        path: "gstType", // populate gstType inside productId
                    },
                    {
                        path: "productName", // populate productName (Material) inside productId
                        // Material model doesn't have nested productName, so no further populate needed
                    },
                ],
            })
            .populate('assignedTo') // Populate product details
        if (!serviceInvoice) {
            return res.status(404).send({ success: false, message: 'Service Invoice not found.' });
        }
        res.status(200).send({ success: true, message: 'Service Invoice fetched', serviceInvoice });
    } catch (error) {
        console.error("Error in getServiceInvoiceById:", error);
        res.status(500).send({ success: false, message: 'Error in getting service invoice', error });
    }
};

// Update Service Invoice
// Update Service Invoice
export const updateServiceInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            invoiceNumber,
            companyId,
            products,
            modeOfPayment,
            bankName, // New field
            transactionDetails, // New field
            chequeDate, // New field
            pendingAmount,
            tdsAmount,
            paymentAmountType,
            transferDate, // New field
            companyNamePayment, // New field
            otherPaymentMode, // New field
            deliveryAddress,
            reference,
            description,
            tax,
            status,
            invoiceDate,
            invoiceLink, // <-- Add invoiceLink here
            quotationDate, // Date when quotation was created
            movedToInvoiceDate, // Date when quotation was moved to invoice
            assignedTo,
            sendTo,
            invoiceType,
            serviceId,
            staus,
            paymentAmount
        } = req.body;

        // Find the invoice to update
        const serviceInvoice = await ServiceInvoice.findById(id);
        if (!serviceInvoice) {
            return res.status(404).send({ success: false, message: 'Service Invoice not found.' });
        }

        // Check if moving from quotation to invoice BEFORE updating invoiceType
        const wasQuotation = serviceInvoice.invoiceType === 'quotation';
        const isMovingToInvoice = invoiceType === 'invoice' && wasQuotation;
        console.log(`[Material Reduction] Invoice check - Current type: ${serviceInvoice.invoiceType}, New type: ${invoiceType}, isMovingToInvoice: ${isMovingToInvoice}`);

        // Generate invoice number from global settings when moving from quotation to invoice
        let finalInvoiceNumber = invoiceNumber;
        if (isMovingToInvoice && !invoiceNumber) {
            // Fetch global invoice count and format
            const commonDetails = await CommonDetails.findOne({});
            
            if (!commonDetails) {
                return res.status(500).send({ 
                    success: false, 
                    message: 'Global invoice settings not found. Please configure invoice settings first.' 
                });
            }

            const globalFormat = commonDetails.globalInvoiceFormat || '';
            
            // Use the stored invoiceCount from DB (this is the actual current count)
            // The format is just a template - we preserve its structure (year, prefix) but use DB count
            let currentCount = typeof commonDetails.invoiceCount === 'number' 
                ? commonDetails.invoiceCount 
                : parseInt(commonDetails.invoiceCount) || 0;
            
            console.log(`[Move to Invoice] Using stored invoiceCount from DB: ${currentCount}`);
            console.log(`[Move to Invoice] Global format template: "${globalFormat}"`);
            console.log(`[Move to Invoice] Format will be preserved (year, prefix) - only number will be replaced`);
            
            // Use currentCount + 1 for the next invoice number
            const nextInvoiceCount = currentCount + 1;
            
            // Generate invoice number from global count and format
            finalInvoiceNumber = generateInvoiceNumber(nextInvoiceCount, globalFormat);
            
            console.log(`[Move to Invoice] Global count: ${currentCount}, Next count: ${nextInvoiceCount}, Format: ${globalFormat}, Generated: ${finalInvoiceNumber}`);
        }

        // Update fields if provided
        if (companyId) {
            const existingCompany = await Company.findById(companyId);
            if (!existingCompany) {
                return res.status(404).send({ success: false, message: 'Company not found.' });
            }
            serviceInvoice.companyId = companyId;
        }

        // Handle products update
        if (products && products.length > 0) {
            const processedProducts = [];
            for (const item of products) {
                if (!item.productId || !item.quantity || item.rate === undefined) {
                    return res.status(400).send({ success: false, message: 'Each product must have productId, quantity, and rate.' });
                }
                if (isNaN(item.quantity) || item.quantity <= 0) {
                    return res.status(400).send({ success: false, message: `Invalid quantity for product ${item.productId}.` });
                }
                if (isNaN(item.rate) || item.rate < 0) {
                    return res.status(400).send({ success: false, message: `Invalid rate for product ${item.productId}.` });
                }

                const serviceProduct = await ServiceProduct.findById(item.productId);
                if (!serviceProduct) {
                    return res.status(404).send({ success: false, message: `Product with ID ${item.productId} not found.` });
                }

                processedProducts.push({
                    productId: item.productId,
                    productName: serviceProduct.productName,
                    quantity: item.quantity,
                    rate: item.rate,
                    totalAmount: item.totalAmount,
                });
            }
            serviceInvoice.products = processedProducts;
            // Assuming calculateInvoiceTotals is a separate function
            const { subtotal, grandTotal } = calculateInvoiceTotals(processedProducts);
            serviceInvoice.subtotal = subtotal;
            serviceInvoice.grandTotal = grandTotal;
        }

        if (modeOfPayment) serviceInvoice.modeOfPayment = modeOfPayment;
        if (pendingAmount) serviceInvoice.pendingAmount = pendingAmount;
        if (tdsAmount) serviceInvoice.tdsAmount = tdsAmount;
        if (paymentAmountType) serviceInvoice.paymentAmountType = paymentAmountType;
        if (bankName !== undefined) serviceInvoice.bankName = bankName; // Update new field
        if (transactionDetails !== undefined) serviceInvoice.transactionDetails = transactionDetails; // Update new field
        if (chequeDate !== undefined) serviceInvoice.chequeDate = chequeDate; // Update new field
        if (transferDate !== undefined) serviceInvoice.transferDate = transferDate; // Update new field
        if (companyNamePayment !== undefined) serviceInvoice.companyNamePayment = companyNamePayment; // Update new field
        if (otherPaymentMode !== undefined) serviceInvoice.otherPaymentMode = otherPaymentMode; // Update new field
        if (deliveryAddress) serviceInvoice.deliveryAddress = deliveryAddress;
        if (reference) serviceInvoice.reference = reference;
        if (description) serviceInvoice.description = description;
        if (tax !== undefined) serviceInvoice.tax = tax;
        if (status) serviceInvoice.status = status;
        if (invoiceDate) serviceInvoice.invoiceDate = invoiceDate;
        if (quotationDate) serviceInvoice.quotationDate = quotationDate; // Preserve quotation date
        if (movedToInvoiceDate) serviceInvoice.movedToInvoiceDate = movedToInvoiceDate; // Track when moved to invoice
        // Only update assignedTo if it's a valid value (not undefined, null, or empty string)
        if (assignedTo && assignedTo !== 'undefined' && assignedTo !== 'null' && assignedTo.toString().trim() !== '') {
            serviceInvoice.assignedTo = assignedTo;
        }
        if (sendTo) serviceInvoice.sendTo = sendTo;
        if (staus) serviceInvoice.staus = staus;
        if (invoiceType) serviceInvoice.invoiceType = invoiceType;
        if (serviceId) serviceInvoice.serviceId = serviceId;
        if (paymentAmount) serviceInvoice.paymentAmount = paymentAmount;
        // Use finalInvoiceNumber (generated from global count if moving to invoice) or provided invoiceNumber
        if (finalInvoiceNumber) serviceInvoice.invoiceNumber = finalInvoiceNumber;
        if (invoiceLink !== undefined) serviceInvoice.invoiceLink = invoiceLink; // Update invoiceLink
        
        // When moving from quotation to invoice, preserve the original invoiceDate as quotationDate
        if (isMovingToInvoice) {
            if (!serviceInvoice.quotationDate && serviceInvoice.invoiceDate) {
                serviceInvoice.quotationDate = serviceInvoice.invoiceDate;
            }
            serviceInvoice.movedToInvoiceDate = new Date();
        }

        await serviceInvoice.save();

        // Increment global invoice count when moving from quotation to invoice
        if (isMovingToInvoice && finalInvoiceNumber) {
            try {
                await CommonDetails.findOneAndUpdate(
                    {},
                    { $inc: { invoiceCount: 1 } },
                    { new: true, upsert: true }
                );
            } catch (error) {
                console.error('Error incrementing invoice count:', error);
                // Don't fail the request if count increment fails
            }
        }

        // Reduce material units when moving from quotation to invoice
        if (isMovingToInvoice && serviceInvoice.products && serviceInvoice.products.length > 0) {
            console.log(`[Material Reduction] Starting material reduction for ${serviceInvoice.products.length} products`);
            try {
                // Fetch the invoice with populated products to get material details
                const populatedInvoice = await ServiceInvoice.findById(serviceInvoice._id)
                    .populate({
                        path: 'products.productId',
                        populate: {
                            path: 'productName' // Populate Material
                        }
                    });

                console.log(`[Material Reduction] Populated invoice with ${populatedInvoice.products.length} products`);

                // Reduce material units for each product
                for (const product of populatedInvoice.products) {
                    console.log(`[Material Reduction] Processing product:`, {
                        productId: product.productId?._id,
                        quantity: product.quantity,
                        hasProductId: !!product.productId,
                        hasProductName: !!product.productId?.productName
                    });

                    const serviceProduct = product.productId;
                    if (serviceProduct && serviceProduct.productName) {
                        const material = serviceProduct.productName;
                        // Material model has 'name' field directly
                        const materialName = material.name;
                        const quantityToReduce = product.quantity;

                        console.log(`[Material Reduction] Material found: ${materialName}, Quantity to reduce: ${quantityToReduce}`);

                        if (materialName && quantityToReduce > 0) {
                            try {
                                // Find the material and reduce its unit
                                const materialDoc = await Material.findOne({ name: materialName });
                                if (materialDoc) {
                                    const currentUnit = Number(materialDoc.unit) || 0;
                                    const unitToSubtract = Number(quantityToReduce) || 0;
                                    const newUnit = currentUnit - unitToSubtract; // Allow negative values
                                    
                                    const updatedMaterial = await Material.findOneAndUpdate(
                                        { name: materialName },
                                        { unit: String(newUnit) },
                                        { new: true }
                                    );
                                    console.log(`[Material Reduction] SUCCESS - Material ${materialName} reduced by ${unitToSubtract} units. Old unit: ${currentUnit}, New unit: ${newUnit}${newUnit < 0 ? ' (NEGATIVE)' : ''}`);
                                } else {
                                    console.warn(`[Material Reduction] Material ${materialName} not found in database`);
                                }
                            } catch (materialError) {
                                console.error(`[Material Reduction] Error reducing material ${materialName}:`, materialError);
                                // Continue with other products even if one fails
                            }
                        } else {
                            console.warn(`[Material Reduction] Skipping product - materialName: ${materialName}, quantityToReduce: ${quantityToReduce}`);
                        }
                    } else {
                        console.warn(`[Material Reduction] Product missing serviceProduct or productName:`, {
                            hasServiceProduct: !!serviceProduct,
                            hasProductName: !!serviceProduct?.productName
                        });
                    }
                }
                console.log("[Material Reduction] Material units reduction process completed");
            } catch (error) {
                console.error("[Material Reduction] Error in material reduction process:", error);
                // Don't fail the invoice update if material reduction fails
            }
        } else {
            console.log(`[Material Reduction] Skipping - isMovingToInvoice: ${isMovingToInvoice}, products length: ${serviceInvoice.products?.length || 0}`);
        }

        // Populate the products field after saving
        // This will replace the `productName` ID with the actual document
        const updatedInvoice = await serviceInvoice.populate({
            path: "products.productId",
            populate: [
                {
                    path: "gstType", // populate gstType inside productId
                },
                {
                    path: "productName", // populate productName (Material) inside productId
                    // Material model doesn't have nested productName, so no further populate needed
                },
            ],
        })

        res.status(200).send({
            success: true,
            message: 'Service Invoice updated successfully',
            serviceInvoice: updatedInvoice // Send the populated invoice
        });

    } catch (error) {
        console.error("Error in updateServiceInvoice:", error);
        res.status(500).send({ success: false, message: 'Error in updating service invoice', error });
    }
};

// Delete Service Invoice
export const deleteServiceInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const serviceInvoice = await ServiceInvoice.findByIdAndDelete(id);
        if (!serviceInvoice) {
            return res.status(404).send({ success: false, message: 'Service Invoice not found.' });
        }
        res.status(200).send({ success: true, message: 'Service Invoice deleted successfully' });
    } catch (error) {
        console.error("Error in deleteServiceInvoice:", error);
        res.status(500).send({ success: false, message: 'Error in deleting service invoice', error });
    }
};