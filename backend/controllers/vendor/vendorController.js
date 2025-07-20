import Vendor from "../../models/vendorModel.js";

// Create Vendor
export const createVendor = async (req, res) => {
    try {
        const { companyName, companyAddress, city, state, pincode, gstNumber, mobileNumber, mailId, personName } = req.body;

        // Basic Validation
        if (!companyName || !companyAddress || !city || !state || !pincode || !mobileNumber || !mailId || !personName) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided.' });
        }

        // Check for unique fields
        const existingMobile = await Vendor.findOne({ mobileNumber });
        if (existingMobile) {
            return res.status(409).send({ success: false, message: 'Vendor with this mobile number already exists.' });
        }
        const existingMail = await Vendor.findOne({ mailId });
        if (existingMail) {
            return res.status(409).send({ success: false, message: 'Vendor with this mail ID already exists.' });
        }
        if (gstNumber) {
            const existingGst = await Vendor.findOne({ gstNumber });
            if (existingGst) {
                return res.status(409).send({ success: false, message: 'Vendor with this GST number already exists.' });
            }
        }

        const newVendor = new Vendor({
            companyName,
            companyAddress,
            city,
            state,
            pincode,
            gstNumber,
            mobileNumber,
            mailId,
            personName,
        });

        await newVendor.save();
        res.status(201).send({ success: true, message: 'Vendor created successfully', vendor: newVendor });
    } catch (error) {
        console.error("Error in createVendor:", error);
        res.status(500).send({ success: false, message: 'Error in creating vendor', error });
    }
};

// Get All Vendors
export const getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({}).sort({ createdAt: -1 });
        res.status(200).send({ success: true, message: 'All Vendors fetched', vendors });
    } catch (error) {
        console.error("Error in getAllVendors:", error);
        res.status(500).send({ success: false, message: 'Error in getting all vendors', error });
    }
};

// Get Single Vendor by ID
export const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findById(id);

        if (!vendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found' });
        }
        res.status(200).send({ success: true, message: 'Vendor fetched successfully', vendor });
    } catch (error) {
        console.error("Error in getVendorById:", error);
        res.status(500).send({ success: false, message: 'Error in getting vendor', error });
    }
};

// Update Vendor
export const updateVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, companyAddress, city, state, pincode, gstNumber, mobileNumber, mailId, personName } = req.body;

        // Basic Validation for update
        if (!companyName || !companyAddress || !city || !state || !pincode || !mobileNumber || !mailId || !personName) {
            return res.status(400).send({ success: false, message: 'All required fields must be provided for update.' });
        }

        // Check for unique fields, excluding the current document
        const existingMobile = await Vendor.findOne({ mobileNumber, _id: { $ne: id } });
        if (existingMobile) {
            return res.status(409).send({ success: false, message: 'Another Vendor with this mobile number already exists.' });
        }
        const existingMail = await Vendor.findOne({ mailId, _id: { $ne: id } });
        if (existingMail) {
            return res.status(409).send({ success: false, message: 'Another Vendor with this mail ID already exists.' });
        }
        if (gstNumber) {
            const existingGst = await Vendor.findOne({ gstNumber, _id: { $ne: id } });
            if (existingGst) {
                return res.status(409).send({ success: false, message: 'Another Vendor with this GST number already exists.' });
            }
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(
            id,
            { companyName, companyAddress, city, state, pincode, gstNumber, mobileNumber, mailId, personName },
            { new: true, runValidators: true }
        );

        if (!updatedVendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found for update.' });
        }
        res.status(200).send({ success: true, message: 'Vendor updated successfully', vendor: updatedVendor });
    } catch (error) {
        console.error("Error in updateVendor:", error);
        res.status(500).send({ success: false, message: 'Error in updating vendor', error });
    }
};

// Delete Vendor
export const deleteVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVendor = await Vendor.findByIdAndDelete(id);

        if (!deletedVendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found for deletion.' });
        }
        res.status(200).send({ success: true, message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error("Error in deleteVendor:", error);
        res.status(500).send({ success: false, message: 'Error in deleting vendor', error });
    }
};