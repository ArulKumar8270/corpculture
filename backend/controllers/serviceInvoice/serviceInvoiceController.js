import ServiceInvoice from "../../models/serviceInvoiceModel.js";
import Company from "../../models/companyModel.js"; // Assuming Company model path
import ServiceProduct from "../../models/serviceProductModel.js"; // Assuming ServiceProduct model path
import cloudinary from "cloudinary";
// Helper function to calculate totals
const calculateInvoiceTotals = (products) => {
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

// Create Service Invoice
export const createServiceInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            companyId,
            products, // Array of { productId, quantity, rate }
            modeOfPayment,
            deliveryAddress,
            reference,
            description,
            tax, // Optional tax from frontend, or calculated here
            invoiceDate
        } = req.body;

        // Basic Validation
        if (!invoiceNumber || !companyId || !products || products.length === 0 || !modeOfPayment || !deliveryAddress) {
            return res.status(400).send({ success: false, message: 'Missing required fields: invoiceNumber, companyId, products, modeOfPayment, deliveryAddress.' });
        }

        // Check if invoice number already exists
        const existingInvoice = await ServiceInvoice.findOne({ invoiceNumber });
        if (existingInvoice) {
            return res.status(409).send({ success: false, message: 'Service Invoice with this invoice number already exists.' });
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

            const totalAmount = item.quantity * item.rate;
            processedProducts.push({
                productId: item.productId,
                productName: serviceProduct.productName, // Use name from the ServiceProduct model
                quantity: item.quantity,
                rate: item.rate,
                totalAmount: totalAmount,
            });
        }

        // Calculate overall invoice totals
        const { subtotal, tax: calculatedTax, grandTotal } = calculateInvoiceTotals(processedProducts);

        const newServiceInvoice = new ServiceInvoice({
            invoiceNumber,
            companyId,
            products: processedProducts,
            modeOfPayment,
            deliveryAddress,
            reference,
            description,
            subtotal,
            tax: tax !== undefined ? tax : calculatedTax, // Use provided tax or calculated one
            grandTotal,
            invoiceDate: invoiceDate || Date.now(),
        });

        await newServiceInvoice.save();

        res.status(201).send({
            success: true,
            message: 'Service Invoice created successfully',
            serviceInvoice: newServiceInvoice
        });

    } catch (error) {
        console.error("Error in createServiceInvoice:", error);
        res.status(500).send({ success: false, message: 'Error in creating service invoice', error });
    }
};

// Get All Service Invoices
export const getAllServiceInvoices = async (req, res) => {
    try {
        const serviceInvoices = await ServiceInvoice.find({})
            .populate('companyId', 'companyName') // Populate company name
            .populate('products.productId', 'productName sku hsn') // Populate product details
            .sort({ createdAt: -1 });

        res.status(200).send({ success: true, message: 'All Service Invoices fetched', serviceInvoices });
    } catch (error) {
        console.error("Error in getAllServiceInvoices:", error);
        res.status(500).send({ success: false, message: 'Error in getting service invoices', error });
    }
};

// Get Single Service Invoice by ID
export const getServiceInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const serviceInvoice = await ServiceInvoice.findById(id)
            .populate('companyId', 'companyName')
            .populate('products.productId', 'productName sku hsn');

        if (!serviceInvoice) {
            return res.status(404).send({ success: false, message: 'Service Invoice not found' });
        }
        res.status(200).send({ success: true, message: 'Service Invoice fetched successfully', serviceInvoice });
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
            deliveryAddress,
            reference,
            description,
            tax,
            status,
            invoiceDate,
            invoiceLink, // <-- Add invoiceLink here
        } = req.body;

        // Find the invoice to update
        const serviceInvoice = await ServiceInvoice.findById(id);
        if (!serviceInvoice) {
            return res.status(404).send({ success: false, message: 'Service Invoice not found.' });
        }

        // Check if invoiceNumber is being changed to an existing one (excluding itself)
        if (invoiceNumber && invoiceNumber !== serviceInvoice.invoiceNumber) {
            const existingInvoice = await ServiceInvoice.findOne({ invoiceNumber });
            if (existingInvoice) {
                return res.status(409).send({ success: false, message: 'Service Invoice with this invoice number already exists.' });
            }
            serviceInvoice.invoiceNumber = invoiceNumber;
        }

        // Update fields if provided
        if (companyId) {
            const existingCompany = await Company.findById(companyId);
            if (!existingCompany) {
                return res.status(404).send({ success: false, message: 'Company not found.' });
            }
            serviceInvoice.companyId = companyId;
        }

        if (modeOfPayment) serviceInvoice.modeOfPayment = modeOfPayment;
        if (deliveryAddress) serviceInvoice.deliveryAddress = deliveryAddress;
        if (reference) serviceInvoice.reference = reference;
        if (description) serviceInvoice.description = description;
        if (status) serviceInvoice.status = status;
        if (invoiceDate) serviceInvoice.invoiceDate = invoiceDate;
        if (invoiceLink) serviceInvoice.invoiceLink = invoiceLink; // <-- Add this line to save the link

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

                const totalAmount = item.quantity * item.rate;
                processedProducts.push({
                    productId: item.productId,
                    productName: serviceProduct.productName,
                    quantity: item.quantity,
                    rate: item.rate,
                    totalAmount: totalAmount,
                });
            }
            serviceInvoice.products = processedProducts;
            const { subtotal, tax: calculatedTax, grandTotal } = calculateInvoiceTotals(processedProducts);
            serviceInvoice.subtotal = subtotal;
            serviceInvoice.tax = tax !== undefined ? tax : calculatedTax;
            serviceInvoice.grandTotal = grandTotal;
        } else if (products && products.length === 0) {
            // If products array is explicitly sent as empty, clear it and reset totals
            serviceInvoice.products = [];
            serviceInvoice.subtotal = 0;
            serviceInvoice.tax = 0;
            serviceInvoice.grandTotal = 0;
        }

        await serviceInvoice.save();

        res.status(200).send({
            success: true,
            message: 'Service Invoice updated successfully',
            serviceInvoice
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