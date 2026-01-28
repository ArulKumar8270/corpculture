import Vendor from "../../models/vendorModel.js";

// Create Vendor
export const createVendor = async (req, res) => {
    try {
        const { companyName, companyAddress, city, state, pincode, gstNumber, contactPersons } = req.body;

        if (!companyName || !companyAddress || !city || !state || !pincode) {
            return res.status(400).send({ success: false, message: 'All required company fields must be provided.' });
        }
        if (!contactPersons || !Array.isArray(contactPersons) || contactPersons.length === 0) {
            return res.status(400).send({ success: false, message: 'At least one contact person is required.' });
        }

        for (const cp of contactPersons) {
            if (!cp.mobileNumber || !cp.mailId || !cp.personName) {
                return res.status(400).send({ success: false, message: 'Each contact must have mobile number, mail ID and person name.' });
            }
        }

        // Check unique mobile/mail across all vendors' contactPersons
        for (const cp of contactPersons) {
            const existing = await Vendor.findOne({
                'contactPersons.mobileNumber': cp.mobileNumber.trim(),
            });
            if (existing) {
                return res.status(409).send({ success: false, message: `Mobile number ${cp.mobileNumber} is already used by another vendor.` });
            }
            const existingMail = await Vendor.findOne({
                'contactPersons.mailId': cp.mailId.trim().toLowerCase(),
            });
            if (existingMail) {
                return res.status(409).send({ success: false, message: `Mail ID ${cp.mailId} is already used by another vendor.` });
            }
        }
        if (gstNumber && gstNumber.trim()) {
            const existingGst = await Vendor.findOne({ gstNumber: gstNumber.trim() });
            if (existingGst) {
                return res.status(409).send({ success: false, message: 'Vendor with this GST number already exists.' });
            }
        }

        const normalizedContacts = contactPersons.map((cp) => ({
            mobileNumber: cp.mobileNumber.trim(),
            mailId: cp.mailId.trim().toLowerCase(),
            personName: cp.personName.trim(),
        }));

        const newVendor = new Vendor({
            companyName,
            companyAddress,
            city,
            state,
            pincode,
            gstNumber: gstNumber ? gstNumber.trim() : undefined,
            contactPersons: normalizedContacts,
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
        const normalized = vendors.map((v) => normalizeVendor(v));
        res.status(200).send({ success: true, message: 'All Vendors fetched', vendors: normalized });
    } catch (error) {
        console.error("Error in getAllVendors:", error);
        res.status(500).send({ success: false, message: 'Error in getting all vendors', error });
    }
};

// Normalize vendor so frontend always gets contactPersons array
function normalizeVendor(vendor) {
    const doc = vendor.toObject ? vendor.toObject() : vendor;
    if (doc.contactPersons && doc.contactPersons.length > 0) {
        return doc;
    }
    if (doc.mobileNumber || doc.mailId || doc.personName) {
        doc.contactPersons = [{
            mobileNumber: doc.mobileNumber || '',
            mailId: doc.mailId || '',
            personName: doc.personName || '',
        }];
    } else {
        doc.contactPersons = [];
    }
    return doc;
}

// Get Single Vendor by ID
export const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findById(id);

        if (!vendor) {
            return res.status(404).send({ success: false, message: 'Vendor not found' });
        }
        const normalized = normalizeVendor(vendor);
        res.status(200).send({ success: true, message: 'Vendor fetched successfully', vendor: normalized });
    } catch (error) {
        console.error("Error in getVendorById:", error);
        res.status(500).send({ success: false, message: 'Error in getting vendor', error });
    }
};

// Update Vendor
export const updateVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, companyAddress, city, state, pincode, gstNumber, contactPersons } = req.body;

        if (!companyName || !companyAddress || !city || !state || !pincode) {
            return res.status(400).send({ success: false, message: 'All required company fields must be provided for update.' });
        }
        if (!contactPersons || !Array.isArray(contactPersons) || contactPersons.length === 0) {
            return res.status(400).send({ success: false, message: 'At least one contact person is required.' });
        }

        for (const cp of contactPersons) {
            if (!cp.mobileNumber || !cp.mailId || !cp.personName) {
                return res.status(400).send({ success: false, message: 'Each contact must have mobile number, mail ID and person name.' });
            }
        }

        // Check unique mobile/mail in other vendors (exclude current)
        for (const cp of contactPersons) {
            const existing = await Vendor.findOne({
                _id: { $ne: id },
                'contactPersons.mobileNumber': cp.mobileNumber.trim(),
            });
            if (existing) {
                return res.status(409).send({ success: false, message: `Mobile number ${cp.mobileNumber} is already used by another vendor.` });
            }
            const existingMail = await Vendor.findOne({
                _id: { $ne: id },
                'contactPersons.mailId': cp.mailId.trim().toLowerCase(),
            });
            if (existingMail) {
                return res.status(409).send({ success: false, message: `Mail ID ${cp.mailId} is already used by another vendor.` });
            }
        }
        if (gstNumber && gstNumber.trim()) {
            const existingGst = await Vendor.findOne({ gstNumber: gstNumber.trim(), _id: { $ne: id } });
            if (existingGst) {
                return res.status(409).send({ success: false, message: 'Another vendor with this GST number already exists.' });
            }
        }

        const normalizedContacts = contactPersons.map((cp) => ({
            mobileNumber: cp.mobileNumber.trim(),
            mailId: cp.mailId.trim().toLowerCase(),
            personName: cp.personName.trim(),
        }));

        const updatedVendor = await Vendor.findByIdAndUpdate(
            id,
            { companyName, companyAddress, city, state, pincode, gstNumber: gstNumber ? gstNumber.trim() : undefined, contactPersons: normalizedContacts },
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