import GST from "../../models/gstModel.js";

// Create GST Type
export const createGst = async (req, res) => {
    try {
        const { gstType, gstPercentage } = req.body;

        // Validation
        if (!gstType || gstPercentage === undefined || gstPercentage === null) {
            return res.status(400).send({ success: false, message: 'GST Type and Percentage are required' });
        }
        if (isNaN(gstPercentage) || parseFloat(gstPercentage) < 0) {
            return res.status(400).send({ success: false, message: 'GST Percentage must be a non-negative number' });
        }

        // Check if GST type already exists
        const existingGst = await GST.findOne({ gstType });
        if (existingGst) {
            return res.status(409).send({ success: false, message: 'GST Type already exists' });
        }

        const newGst = await new GST({ gstType, gstPercentage }).save();
        res.status(201).send({ success: true, message: 'GST Type created successfully', gst: newGst });
    } catch (error) {
        console.error("Error in createGst:", error);
        res.status(500).send({ success: false, message: 'Error in creating GST Type', error });
    }
};

// Get All GST Types
export const getAllGst = async (req, res) => {
    try {
        const gstTypes = await GST.find({}).sort({ createdAt: -1 });
        res.status(200).send({ success: true, message: 'All GST Types fetched', gst: gstTypes });
    } catch (error) {
        console.error("Error in getAllGst:", error);
        res.status(500).send({ success: false, message: 'Error in getting all GST Types', error });
    }
};

// Get Single GST Type by ID
export const getGstById = async (req, res) => {
    try {
        const gstId = req.params.id;
        const gst = await GST.findById(gstId);

        if (!gst) {
            return res.status(404).send({ success: false, message: 'GST Type not found' });
        }
        res.status(200).send({ success: true, message: 'GST Type fetched successfully', gst });
    } catch (error) {
        console.error("Error in getGstById:", error);
        res.status(500).send({ success: false, message: 'Error in getting GST Type', error });
    }
};

// Update GST Type
export const updateGst = async (req, res) => {
    try {
        const gstId = req.params.id;
        const { gstType, gstPercentage } = req.body;

        if (!gstType || gstPercentage === undefined || gstPercentage === null) {
            return res.status(400).send({ success: false, message: 'GST Type and Percentage are required' });
        }
        if (isNaN(gstPercentage) || parseFloat(gstPercentage) < 0) {
            return res.status(400).send({ success: false, message: 'GST Percentage must be a non-negative number' });
        }

        const updatedGst = await GST.findByIdAndUpdate(
            gstId,
            { gstType, gstPercentage },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedGst) {
            return res.status(404).send({ success: false, message: 'GST Type not found' });
        }
        res.status(200).send({ success: true, message: 'GST Type updated successfully', gst: updatedGst });
    } catch (error) {
        console.error("Error in updateGst:", error);
        res.status(500).send({ success: false, message: 'Error in updating GST Type', error });
    }
};

// Delete GST Type
export const deleteGst = async (req, res) => {
    try {
        const gstId = req.params.id;
        const deletedGst = await GST.findByIdAndDelete(gstId);

        if (!deletedGst) {
            return res.status(404).send({ success: false, message: 'GST Type not found' });
        }
        res.status(200).send({ success: true, message: 'GST Type deleted successfully' });
    } catch (error) {
        console.error("Error in deleteGst:", error);
        res.status(500).send({ success: false, message: 'Error in deleting GST Type', error });
    }
};