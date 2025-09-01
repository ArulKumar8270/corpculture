import ServiceInvoice from "../../models/serviceInvoiceModel.js";
import Company from "../../models/companyModel.js"; // Assuming Company model path
import ServiceProduct from "../../models/serviceProductModel.js"; // Assuming ServiceProduct model path
import cloudinary from "cloudinary";
// Helper function to calculate totals
const calculateInvoiceTotals = (products) => {
    let subtotal = 0;
    for (const item of products) {
        subtotal += item.quantity * item.totalAmount;
    }
    // For simplicity, tax is assumed to be 0 for now or handled externally.
    // You can add tax calculation logic here if needed.
    const tax = 0; // Example: subtotal * 0.05 for 5% tax
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
};

// Create Service Invoice
export const createServiceInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
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
            assignedTo,
            sendTo,
            invoiceType,
            serviceId
        } = req.body;


        // Basic Validation
        if (!companyId || !products || products.length === 0 || !modeOfPayment || !deliveryAddress) {
            return res.status(400).send({ success: false, message: 'Missing required fields: companyId, products, modeOfPayment, deliveryAddress.' });
        }

        // Check if invoice number already exists
        if (invoiceNumber) {
            const existingInvoice = await ServiceInvoice.findOne({ invoiceNumber });
            if (existingInvoice) {
                return res.status(409).send({ success: false, message: 'Service Invoice with this invoice number already exists.' });
            }
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
                totalAmount: item.quantity * item.totalAmount,
            });
        }

        const { subtotal, grandTotal } = calculateInvoiceTotals(processedProducts);

        const newServiceInvoice = new ServiceInvoice({
            invoiceNumber,
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
            assignedTo,
            sendTo,
            invoiceType,
            serviceId
        });

        await newServiceInvoice.save();

        // Fetch the newly created invoice and populate necessary fields
        const populatedInvoice = await ServiceInvoice.findById(newServiceInvoice._id)
            .populate('companyId') // Populate company details
            .populate({
                path: 'products.productId', // Populate product details
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
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
            .populate('companyId')
            .populate({
                path: 'products.productId',
                populate: {
                    path: 'gstType',
                }
            })
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
                path: 'products.productId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
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
                path: 'products.productId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
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
            assignedTo,
            sendTo,
            invoiceType,
            serviceId,
            staus
        } = req.body;

        // Find the invoice to update
        const serviceInvoice = await ServiceInvoice.findById(id);
        if (!serviceInvoice) {
            return res.status(404).send({ success: false, message: 'Service Invoice not found.' });
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
                    totalAmount: item.quantity * item.totalAmount,
                });
            }
            serviceInvoice.products = processedProducts;
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
        if (assignedTo) serviceInvoice.assignedTo = assignedTo;
        if (sendTo) serviceInvoice.sendTo = sendTo;
        if (staus) serviceInvoice.staus = staus;
        if (invoiceType) serviceInvoice.invoiceType = invoiceType;
        if (serviceId) serviceInvoice.serviceId = serviceId;
        if (invoiceNumber) serviceInvoice.invoiceNumber = invoiceNumber;
        if (invoiceLink !== undefined) serviceInvoice.invoiceLink = invoiceLink; // Update invoiceLink

        await serviceInvoice.save();
        res.status(200).send({ success: true, message: 'Service Invoice updated successfully', serviceInvoice });

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