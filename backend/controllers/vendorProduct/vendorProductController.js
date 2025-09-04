import VendorProduct from "../../models/vendorProductModel.js";
import Vendor from "../../models/vendorModel.js"; // Assuming this path is correct
import GST from "../../models/gstModel.js"; // Assuming this path is correct

// Create Vendor Product
export const createVendorProduct = async (req, res) => {
    try {
        const { vendorCompanyName, productName, gstType, pricePerQuantity } = req.body;

        // Validation
        if (!vendorCompanyName || !productName || !gstType || pricePerQuantity === undefined) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided.' });
        }
        if (isNaN(parseFloat(pricePerQuantity)) || parseFloat(pricePerQuantity) < 0) {
            return res.status(400).send({ success: false, message: 'Price Per Quantity must be a non-negative number.' });
        }

        // Check if vendor exists
        const existingVendor = await Vendor.findById(vendorCompanyName);
        if (!existingVendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found.' });
        }

        // Check if GST type exists
        const existingGstType = await GST.findById(gstType);
        if (!existingGstType) {
            return res.status(404).send({ success: false, message: 'GST Type not found.' });
        }

        // Optional: Check for unique product name per vendor if compound index is used
        // const existingVendorProduct = await VendorProduct.findOne({ vendorCompanyName, productName });
        // if (existingVendorProduct) {
        //     return res.status(409).send({ success: false, message: 'Product with this name already exists for this vendor.' });
        // }

        const newVendorProduct = new VendorProduct({
            vendorCompanyName,
            productName,
            gstType,
            pricePerQuantity: parseFloat(pricePerQuantity),
        });

        await newVendorProduct.save();
        res.status(201).send({ success: true, message: 'Vendor Product created successfully', vendorProduct: newVendorProduct });
    } catch (error) {
        console.error("Error in createVendorProduct:", error);
        res.status(500).send({ success: false, message: 'Error in creating vendor product', error });
    }
};

// Get All Vendor Products
export const getAllVendorProducts = async (req, res) => {
    try {
        const vendorProducts = await VendorProduct.find({})
            .populate('vendorCompanyName', 'companyName') // Populate vendor company name
            .populate('gstType', 'gstType gstPercentage') // Populate GST details
            .sort({ createdAt: -1 });

        res.status(200).send({ success: true, message: 'All Vendor Products fetched', vendorProducts });
    } catch (error) {
        console.error("Error in getAllVendorProducts:", error);
        res.status(500).send({ success: false, message: 'Error in getting all vendor products', error });
    }
};

// Get Single Vendor Product by ID
export const getVendorProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorProduct = await VendorProduct.findById(id)
            .populate('vendorCompanyName', 'companyName')
            .populate('gstType', 'gstType gstPercentage');

        if (!vendorProduct) {
            return res.status(404).send({ success: false, message: 'Vendor Product not found' });
        }
        res.status(200).send({ success: true, message: 'Vendor Product fetched successfully', vendorProduct });
    } catch (error) {
        console.error("Error in getVendorProductById:", error);
        res.status(500).send({ success: false, message: 'Error in getting vendor product', error });
    }
};

// Update Vendor Product
export const updateVendorProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendorCompanyName, productName, gstType, pricePerQuantity } = req.body;

        // Basic Validation for update
        if (!vendorCompanyName || !productName || !gstType || pricePerQuantity === undefined) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided for update.' });
        }
        if (isNaN(parseFloat(pricePerQuantity)) || parseFloat(pricePerQuantity) < 0) {
            return res.status(400).send({ success: false, message: 'Price Per Quantity must be a non-negative number.' });
        }

        // Check if vendor exists
        const existingVendor = await Vendor.findById(vendorCompanyName);
        if (!existingVendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found.' });
        }

        // Check if GST type exists
        const existingGstType = await GST.findById(gstType);
        if (!existingGstType) {
            return res.status(404).send({ success: false, message: 'GST Type not found.' });
        }

        // Optional: Check for unique product name per vendor, excluding the current document
        // const duplicateVendorProduct = await VendorProduct.findOne({ vendorCompanyName, productName, _id: { $ne: id } });
        // if (duplicateVendorProduct) {
        //     return res.status(409).send({ success: false, message: 'Another Product with this name already exists for this vendor.' });
        // }

        const updatedVendorProduct = await VendorProduct.findByIdAndUpdate(
            id,
            {
                vendorCompanyName,
                productName,
                gstType,
                pricePerQuantity: parseFloat(pricePerQuantity),
            },
            { new: true, runValidators: true }
        );

        if (!updatedVendorProduct) {
            return res.status(404).send({ success: false, message: 'Vendor Product not found for update.' });
        }
        res.status(200).send({ success: true, message: 'Vendor Product updated successfully', vendorProduct: updatedVendorProduct });
    } catch (error) {
        console.error("Error in updateVendorProduct:", error);
        res.status(500).send({ success: false, message: 'Error in updating vendor product', error });
    }
};

// Delete Vendor Product
export const deleteVendorProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVendorProduct = await VendorProduct.findByIdAndDelete(id);

        if (!deletedVendorProduct) {
            return res.status(404).send({ success: false, message: 'Vendor Product not found for deletion.' });
        }
        res.status(200).send({ success: true, message: 'Vendor Product deleted successfully' });
    } catch (error) {
        console.error("Error in deleteVendorProduct:", error);
        res.status(500).send({ success: false, message: 'Error in deleting vendor product', error });
    }
};

// Get Vendor Products by Vendor ID
export const getProductsByVendorId = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!vendorId) {
            return res.status(400).send({ success: false, message: 'Vendor ID is required.' });
        }

        const vendorProducts = await VendorProduct.find({ vendorCompanyName: vendorId })
            .populate('vendorCompanyName', 'companyName')
            .populate('gstType', 'gstType gstPercentage')
            .sort({ createdAt: -1 });

        if (!vendorProducts || vendorProducts.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No products found for this vendor.'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Vendor products fetched successfully for the vendor',
            vendorProducts
        });
    } catch (error) {
        console.error("Error in getProductsByVendorId:", error);
        res.status(500).send({
            success: false,
            message: 'Error in fetching vendor products by vendor ID',
            error
        });
    }
};