import ServiceProduct from "../../models/serviceProductModel.js";
import Company from "../../models/companyModel.js"; // Assuming this path is correct
import GST from "../../models/gstModel.js"; // Assuming this path is correct

// Create Service Product
export const createServiceProduct = async (req, res) => {
    try {
        const { company, productName, sku, hsn, quantity, rate, gstType, totalAmount, commission } = req.body;

        // Validation
        if (!company || !productName || !sku || quantity === undefined || rate === undefined || !gstType || totalAmount === undefined) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided.' });
        }
        if (isNaN(quantity) || quantity < 0) {
            return res.status(400).send({ success: false, message: 'Quantity must be a non-negative number.' });
        }
        if (isNaN(rate) || rate < 0) {
            return res.status(400).send({ success: false, message: 'Rate must be a non-negative number.' });
        }
        if (isNaN(totalAmount) || totalAmount < 0) {
            return res.status(400).send({ success: false, message: 'Total Amount must be a non-negative number.' });
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

        // Check if SKU already exists
        const existingProduct = await ServiceProduct.findOne({ sku });
        if (existingProduct) {
            return res.status(409).send({ success: false, message: 'Service Product with this SKU already exists.' });
        }

        const newServiceProduct = new ServiceProduct({
            company,
            productName,
            sku,
            hsn,
            quantity: parseInt(quantity),
            rate: parseFloat(rate),
            gstType,
            commission,
            totalAmount: parseFloat(totalAmount),
        });

        await newServiceProduct.save();
        res.status(201).send({ success: true, message: 'Service Product created successfully', serviceProduct: newServiceProduct });
    } catch (error) {
        console.error("Error in createServiceProduct:", error);
        res.status(500).send({ success: false, message: 'Error in creating service product', error });
    }
};

// Get All Service Products
export const getAllServiceProducts = async (req, res) => {
    try {
        const serviceProducts = await ServiceProduct.find({})
            .populate('company') // Populate company name
            .populate('gstType', 'gstType gstPercentage') // Populate GST details
            .sort({ createdAt: -1 });

        res.status(200).send({ success: true, message: 'All Service Products fetched', serviceProducts });
    } catch (error) {
        console.error("Error in getAllServiceProducts:", error);
        res.status(500).send({ success: false, message: 'Error in getting all service products', error });
    }
};

// Get Single Service Product by ID
export const getServiceProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const serviceProduct = await ServiceProduct.findById(id)
            .populate('company', 'name')
            .populate('gstType', 'gstType gstPercentage');

        if (!serviceProduct) {
            return res.status(404).send({ success: false, message: 'Service Product not found' });
        }
        res.status(200).send({ success: true, message: 'Service Product fetched successfully', serviceProduct });
    } catch (error) {
        console.error("Error in getServiceProductById:", error);
        res.status(500).send({ success: false, message: 'Error in getting service product', error });
    }
};

// Get Service Products by Company ID
export const getServiceProductsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params; // Assuming companyId is passed as a URL parameter

        if (!companyId) {
            return res.status(400).send({ success: false, message: 'Company ID is required.' });
        }

        const serviceProducts = await ServiceProduct.find({ company: companyId })
            .populate('company', 'name') // Populate company name
            .populate('gstType', 'gstType gstPercentage') // Populate GST details
            .sort({ createdAt: -1 });

        if (!serviceProducts || serviceProducts.length === 0) {
            return res.status(404).send({ success: false, message: 'No service products found for this company.' });
        }

        res.status(200).send({ success: true, message: 'Service Products fetched by company successfully', serviceProducts });
    } catch (error) {
        console.error("Error in getServiceProductsByCompany:", error);
        res.status(500).send({ success: false, message: 'Error in getting service products by company', error });
    }
};

// Update Service Product
export const updateServiceProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { company, productName, sku, hsn, quantity, rate, gstType, totalAmount, commission } = req.body;

        // Basic validation for required fields (can be more granular)
        if (!company || !productName || !sku || quantity === undefined || rate === undefined || !gstType || totalAmount === undefined) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided for update.' });
        }
        if (isNaN(quantity) || quantity < 0) {
            return res.status(400).send({ success: false, message: 'Quantity must be a non-negative number.' });
        }
        if (isNaN(rate) || rate < 0) {
            return res.status(400).send({ success: false, message: 'Rate must be a non-negative number.' });
        }
        if (isNaN(totalAmount) || totalAmount < 0) {
            return res.status(400).send({ success: false, message: 'Total Amount must be a non-negative number.' });
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

        // Check for duplicate SKU, excluding the current product
        const duplicateSku = await ServiceProduct.findOne({ sku, _id: { $ne: id } });
        if (duplicateSku) {
            return res.status(409).send({ success: false, message: 'Another Service Product with this SKU already exists.' });
        }

        const updatedServiceProduct = await ServiceProduct.findByIdAndUpdate(
            id,
            {
                company,
                productName,
                sku,
                hsn,
                quantity: parseInt(quantity),
                rate: parseFloat(rate),
                gstType,
                commission,
                totalAmount: parseFloat(totalAmount),
            },
            { new: true, runValidators: true }
        );

        if (!updatedServiceProduct) {
            return res.status(404).send({ success: false, message: 'Service Product not found for update.' });
        }
        res.status(200).send({ success: true, message: 'Service Product updated successfully', serviceProduct: updatedServiceProduct });
    } catch (error) {
        console.error("Error in updateServiceProduct:", error);
        res.status(500).send({ success: false, message: 'Error in updating service product', error });
    }
};

// Delete Service Product
export const deleteServiceProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedServiceProduct = await ServiceProduct.findByIdAndDelete(id);

        if (!deletedServiceProduct) {
            return res.status(404).send({ success: false, message: 'Service Product not found for deletion.' });
        }
        res.status(200).send({ success: true, message: 'Service Product deleted successfully' });
    } catch (error) {
        console.error("Error in deleteServiceProduct:", error);
        res.status(500).send({ success: false, message: 'Error in deleting service product', error });
    }
};