import ServiceQuotation from "../../models/serviceQuotationModel.js";
import Company from "../../models/companyModel.js"; // Assuming Company model path
import ServiceProduct from "../../models/serviceProductModel.js";

// Helper function to calculate totals
const calculateQuotationTotals = (products) => {
    let subtotal = 0;
    for (const item of products) {
        subtotal += item.quantity * item.rate;
    }
    // For simplicity, tax is assumed to be 0 for now or handled externally.
    // You can add tax calculation logic here if needed.
    const tax = 0; // Example: subtotal * 0.05 for 5% tax
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
};

// Create Service Quotation
export const createServiceQuotation = async (req, res) => {
    try {
        const {
            quotationNumber,
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
            quotationDate,
            assignedTo
        } = req.body;

        // Basic Validation
        if (!quotationNumber || !companyId || !products || products.length === 0 || !modeOfPayment || !deliveryAddress) {
            return res.status(400).send({ success: false, message: 'Missing required fields: QuotationNumber, companyId, products, modeOfPayment, deliveryAddress.' });
        }

        // Check if Quotation number already exists
        const existingQuotation = await ServiceQuotation.findOne({ quotationNumber });
        if (existingQuotation) {
            return res.status(409).send({ success: false, message: 'Service Quotation with this Quotation number already exists.' });
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
                productName: serviceProduct.productName, // Use name from the ServiceProduct model
                quantity: item.quantity,
                rate: item.rate,
                totalAmount: item.quantity * item.rate,
            });
        }

        // Calculate overall Quotation totals
        const { subtotal, grandTotal } = calculateQuotationTotals(processedProducts);
        const newServiceQuotation = new ServiceQuotation({
            quotationNumber,
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
            tax: tax || 0, // Use provided tax or default to 0 // Use provided tax or calculated one
            grandTotal,
            quotationDate: quotationDate || Date.now(),
            assignedTo
        });

        await newServiceQuotation.save();

        res.status(201).send({ success: true, message: 'Service quotation created successfully', serviceQuotation: newServiceQuotation });


    } catch (error) {
        console.error("Error in createServiceQuotation:", error);
        res.status(500).send({ success: false, message: 'Error in creating service Quotation', error });
    }
};

// Get All Service Quotations
export const getAllServiceQuotations = async (req, res) => {
    try {
        const serviceQuotations = await ServiceQuotation.find({})
            .populate('companyId') // Populate company name
            .populate({
                path: 'products.productId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate('assignedTo') // Populate product details
            .sort({ createdAt: -1 });

        res.status(200).send({ success: true, message: 'All Service Quotations fetched', serviceQuotations });
    } catch (error) {
        console.error("Error in getAllServiceQuotations:", error);
        res.status(500).send({ success: false, message: 'Error in getting service Quotations', error });
    }
};

// Get Single Service Quotation by ID
export const getServiceQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const serviceQuotation = await ServiceQuotation.findById(id)
            .populate('companyId') // Populate company name
            .populate({
                path: 'products.productId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate('assignedTo') // Populate product details
        if (!serviceQuotation) {
            return res.status(404).send({ success: false, message: 'Service Quotation not found' });
        }
        res.status(200).send({ success: true, message: 'Service Quotation fetched successfully', serviceQuotation });
    } catch (error) {
        console.error("Error in getServiceQuotationById:", error);
        res.status(500).send({ success: false, message: 'Error in getting service Quotation', error });
    }
};


// Get Service Quotation by assignedTo
export const getServiceQuotationAssignedTo = async (req, res) => {
    try {
        const { assignedTo } = req.params; // Assuming phone is passed as a URL parameter

        if (!assignedTo) {
            return res.status(400).send({
                success: false,
                message: "assignedTo is required",
                errorType: "missingParameter"
            });
        }

        const serviceQuotations = await ServiceQuotation.find({ assignedTo: assignedTo })
            .populate('companyId') // Populate company name
            .populate({
                path: 'products.productId', // First populate productId
                populate: {
                    path: 'gstType',        // Then populate gstType inside the product
                }
            })// Populate product details
            .populate('assignedTo') // Populate product details
            .sort({ createdAt: -1 }); // Find services by phone number

        if (!serviceQuotations || serviceQuotations.length === 0) {
            return res.status(404).send({
                success: false,
                message: "No ServiceQuotation found for this assigned to",
                errorType: "servicesNotFound"
            });
        }

        res.status(200).send({
            success: true,
            serviceQuotations
        });
    } catch (error) {
        console.error("Error in getting ServiceQuotation by phone:", error); // Log the error
        res.status(500).send({
            success: false,
            message: "Error in getting services by phone",
            error
        });
    }
};


// Update Service Quotation
export const updateServiceQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            quotationNumber,
            companyId,
            products,
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
            tax,
            status,
            quotationDate,
            quotationLink,
            assignedTo
        } = req.body;

        // Find the Quotation to update
        const serviceQuotation = await ServiceQuotation.findById(id);
        if (!serviceQuotation) {
            return res.status(404).send({ success: false, message: 'Service Quotation not found.' });
        }

        // Check if QuotationNumber is being changed to an existing one (excluding itself)
        if (quotationNumber && quotationNumber !== serviceQuotation.quotationNumber) {
            const existingQuotation = await ServiceQuotation.findOne({ quotationNumber });
            if (existingQuotation) {
                return res.status(409).send({ success: false, message: 'Service Quotation with this Quotation number already exists.' });
            }
            serviceQuotation.quotationNumber = quotationNumber;
        }

        // Update fields if provided
        if (companyId) {
            const existingCompany = await Company.findById(companyId);
            if (!existingCompany) {
                return res.status(404).send({ success: false, message: 'Company not found.' });
            }
            serviceQuotation.companyId = companyId;
        }


        // Handle products update and recalculate totals
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
                    totalAmount: item.quantity * item.rate,
                });
            }
            serviceQuotation.products = processedProducts;
            const { subtotal, grandTotal } = calculateQuotationTotals(processedProducts);
            serviceQuotation.subtotal = subtotal;
            serviceQuotation.grandTotal = grandTotal;
        }

        if (modeOfPayment) serviceQuotation.modeOfPayment = modeOfPayment;
        if (bankName !== undefined) serviceQuotation.bankName = bankName; // Update new field
        if (transactionDetails !== undefined) serviceQuotation.transactionDetails = transactionDetails; // Update new field
        if (chequeDate !== undefined) serviceQuotation.chequeDate = chequeDate; // Update new field
        if (transferDate !== undefined) serviceQuotation.transferDate = transferDate; // Update new field
        if (companyNamePayment !== undefined) serviceQuotation.companyNamePayment = companyNamePayment; // Update new field
        if (otherPaymentMode !== undefined) serviceQuotation.otherPaymentMode = otherPaymentMode; // Update new field
        if (deliveryAddress) serviceQuotation.deliveryAddress = deliveryAddress;
        if (reference) serviceQuotation.reference = reference;
        if (description) serviceQuotation.description = description;
        if (tax !== undefined) serviceQuotation.tax = tax;
        if (status) serviceQuotation.status = status;
        if (quotationDate) serviceQuotation.quotationDate = quotationDate;
        if (assignedTo) serviceQuotation.assignedTo = assignedTo;
        if (quotationLink !== undefined) serviceQuotation.quotationLink = quotationLink; // Update invoiceLink
        await serviceQuotation.save();

        res.status(200).send({
            success: true,
            message: 'Service Quotation updated successfully',
            serviceQuotation
        });

    } catch (error) {
        console.error("Error in updateServiceQuotation:", error);
        res.status(500).send({ success: false, message: 'Error in updating service Quotation', error });
    }
};

// Delete Service Quotation
export const deleteServiceQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const serviceQuotation = await ServiceQuotation.findByIdAndDelete(id);

        if (!serviceQuotation) {
            return res.status(404).send({ success: false, message: 'Service Quotation not found.' });
        }

        res.status(200).send({ success: true, message: 'Service Quotation deleted successfully' });
    } catch (error) {
        console.error("Error in deleteServiceQuotation:", error);
        res.status(500).send({ success: false, message: 'Error in deleting service Quotation', error });
    }
};