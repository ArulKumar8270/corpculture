import Purchase from "../../models/purchaseModel.js";
import Vendor from "../../models/vendorModel.js"; // Assuming this path is correct
import GST from "../../models/gstModel.js"; // Assuming this path is correct

// Create Purchase
export const createPurchase = async (req, res) => {
    try {
        const {
            vendorCompanyName, productName, voucherType, purchaseInvoiceNumber, narration, purchaseDate, quantity, rate, freightCharges, price, grossTotal, roundOff
        } = req.body;

        // Validation
        if (!vendorCompanyName || !productName || !voucherType || !purchaseInvoiceNumber ||
            !purchaseDate || quantity === undefined || rate === undefined || price === undefined || grossTotal === undefined) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided.' });
        }

        if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
            return res.status(400).send({ success: false, message: 'Quantity must be a non-negative number.' });
        }
        if (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
            return res.status(400).send({ success: false, message: 'Rate must be a non-negative number.' });
        }
        if (freightCharges !== undefined && (isNaN(parseFloat(freightCharges)) || parseFloat(freightCharges) < 0)) {
            return res.status(400).send({ success: false, message: 'Freight Charges must be a non-negative number.' });
        }
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            return res.status(400).send({ success: false, message: 'Price must be a non-negative number.' });
        }
        if (isNaN(parseFloat(grossTotal)) || parseFloat(grossTotal) < 0) {
            return res.status(400).send({ success: false, message: 'Gross Total must be a non-negative number.' });
        }
        if (roundOff !== undefined && isNaN(parseFloat(roundOff))) {
            return res.status(400).send({ success: false, message: 'Round Off must be a number.' });
        }

        // Check if vendor exists
        const existingVendor = await Vendor.findById(vendorCompanyName);
        if (!existingVendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found.' });
        }

        // Check if purchase invoice number already exists
        const existingPurchase = await Purchase.findOne({ purchaseInvoiceNumber });
        if (existingPurchase) {
            return res.status(409).send({ success: false, message: 'Purchase with this invoice number already exists.' });
        }

        const newPurchase = new Purchase({
            vendorCompanyName,
            productName,
            voucherType,
            purchaseInvoiceNumber,
            narration,
            purchaseDate: new Date(purchaseDate),
            quantity: parseFloat(quantity),
            rate: parseFloat(rate),
            freightCharges: freightCharges !== undefined ? parseFloat(freightCharges) : 0,
            price: parseFloat(price),
            grossTotal: parseFloat(grossTotal),
            roundOff: roundOff !== undefined ? parseFloat(roundOff) : 0,
        });

        await newPurchase.save();
        res.status(201).send({ success: true, message: 'Purchase created successfully', purchase: newPurchase });
    } catch (error) {
        console.error("Error in createPurchase:", error);
        res.status(500).send({ success: false, message: 'Error in creating purchase', error });
    }
};

// Get All Purchases
export const getAllPurchases = async (req, res) => {
    try {
        const { category } = req.query; // Get category from query parameters
        let filter = {};

        if (category) {
            filter.category = category; // Add category to filter if provided
        }

        const purchases = await Purchase.find(filter) // Apply the filter
            .populate('vendorCompanyName', 'companyName') // Populate vendor company name
            .populate('productName') // Populate product details
            .sort({ createdAt: -1 });

        res.status(200).send({ success: true, message: 'All Purchases fetched', purchases });
    } catch (error) {
        console.error("Error in getAllPurchases:", error);
        res.status(500).send({ success: false, message: 'Error in getting all purchases', error });
    }
};

// Get Single Purchase by ID
export const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await Purchase.findById(id)
            .populate('vendorCompanyName')
            .populate('productName') // Populate product details
            .populate({
                path: "productName",
                populate: [
                    {
                        path: "gstType", // populate gstType inside productId
                    }
                ]
            })
        if (!purchase) {
            return res.status(404).send({ success: false, message: 'Purchase not found' });
        }
        res.status(200).send({ success: true, message: 'Purchase fetched successfully', purchase });
    } catch (error) {
        console.error("Error in getPurchaseById:", error);
        res.status(500).send({ success: false, message: 'Error in getting purchase', error });
    }
};

// Update Purchase
export const updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            vendorCompanyName, productName, voucherType, purchaseInvoiceNumber, narration, purchaseDate, quantity, rate, freightCharges, price, grossTotal, roundOff
        } = req.body;

        // Basic Validation for update
        // if (!productName) {
        //     return res.status(400).send({ success: false, message: 'All required fields must be provided for update.' });
        // }

        // if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
        //     return res.status(400).send({ success: false, message: 'Quantity must be a non-negative number.' });
        // }
        // if (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
        //     return res.status(400).send({ success: false, message: 'Rate must be a non-negative number.' });
        // }
        // if (freightCharges !== undefined && (isNaN(parseFloat(freightCharges)) || parseFloat(freightCharges) < 0)) {
        //     return res.status(400).send({ success: false, message: 'Freight Charges must be a non-negative number.' });
        // }
        // if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        //     return res.status(400).send({ success: false, message: 'Price must be a non-negative number.' });
        // }
        // if (isNaN(parseFloat(grossTotal)) || parseFloat(grossTotal) < 0) {
        //     return res.status(400).send({ success: false, message: 'Gross Total must be a non-negative number.' });
        // }
        // if (roundOff !== undefined && isNaN(parseFloat(roundOff))) {
        //     return res.status(400).send({ success: false, message: 'Round Off must be a number.' });
        // }

        // Check if vendor exists
        if (vendorCompanyName) {
            const existingVendor = await Vendor.findById(vendorCompanyName);
            if (!existingVendor) {
                return res.status(404).send({ success: false, message: 'Vendor not found.' });
            }
        }

        // Check for duplicate invoice number, excluding the current document
        const duplicateInvoice = await Purchase.findOne({ purchaseInvoiceNumber, _id: { $ne: id } });
        if (duplicateInvoice) {
            return res.status(409).send({ success: false, message: 'Another Purchase with this invoice number already exists.' });
        }

        const updateFields = {};

        if (vendorCompanyName !== undefined) updateFields.vendorCompanyName = vendorCompanyName;
        if (productName !== undefined) updateFields.productName = productName;
        if (voucherType !== undefined) updateFields.voucherType = voucherType;
        if (purchaseInvoiceNumber !== undefined) updateFields.purchaseInvoiceNumber = purchaseInvoiceNumber;
        if (narration !== undefined) updateFields.narration = narration;
        if (purchaseDate !== undefined) updateFields.purchaseDate = new Date(purchaseDate);
        if (quantity !== undefined) updateFields.quantity = quantity;
        if (rate !== undefined) updateFields.rate = parseFloat(rate);
        if (freightCharges !== undefined) updateFields.freightCharges = parseFloat(freightCharges);
        if (price !== undefined) updateFields.price = parseFloat(price);
        if (grossTotal !== undefined) updateFields.grossTotal = parseFloat(grossTotal);
        if (roundOff !== undefined) updateFields.roundOff = parseFloat(roundOff);

        const updatedPurchase = await Purchase.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedPurchase) {
            return res.status(404).send({ success: false, message: 'Purchase not found for update.' });
        }
        res.status(200).send({ success: true, message: 'Purchase updated successfully', purchase: updatedPurchase });
    } catch (error) {
        console.error("Error in updatePurchase:", error);
        res.status(500).send({ success: false, message: 'Error in updating purchase', error });
    }
};

// Delete Purchase
export const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPurchase = await Purchase.findByIdAndDelete(id);

        if (!deletedPurchase) {
            return res.status(404).send({ success: false, message: 'Purchase not found for deletion.' });
        }
        res.status(200).send({ success: true, message: 'Purchase deleted successfully' });
    } catch (error) {
        console.error("Error in deletePurchase:", error);
        res.status(500).send({ success: false, message: 'Error in deleting purchase', error });
    }
};