import RentalProduct from "../../models/rentalProductModel.js";
import Company from "../../models/companyModel.js"; // Assuming this path is correct
import GST from "../../models/gstModel.js"; // Assuming this path is correct

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

// Create Rental Product
export const createRentalProduct = async (req, res) => {
    try {
        const {
            company, branch, department, modelName, serialNo, hsn, basePrice, gstType, paymentDate,
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
export const updateRentalProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            company, branch, department, modelName, serialNo, hsn, basePrice, gstType, paymentDate,
            modelSpecs, a3Config, a4Config, a5Config, employeeId, commission
        } = req.body;

        // Basic Validation for update
        if (!company || !branch || !department || !modelName || !serialNo || basePrice === undefined || !gstType || !paymentDate) {
            return res.status(400).send({ success: false, message: 'Company, branch, department, model name, serial number, base price, GST type, and payment date are required for update.' });
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

        // Check for duplicate serial number, excluding the current product
        const duplicateSerialNo = await RentalProduct.findOne({ serialNo, _id: { $ne: id } });
        if (duplicateSerialNo) {
            return res.status(409).send({ success: false, message: 'Another Rental Product with this serial number already exists.' });
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
                paymentDate: new Date(paymentDate),
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

// Get Today's Rental Products
export const getTodaysRentalProducts = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const rentalProducts = await RentalProduct.find({
            paymentDate: {
                $gte: today,
                $lte: endOfDay
            }
        })
            .populate('company')
            .populate('gstType')
            .sort({ createdAt: -1 });

        res.status(200).json(rentalProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};