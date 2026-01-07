import CommonDetails from "../../models/commonDetailsModel.js";

// Create Common Details (intended for initial setup, ideally only one document)
export const createCommonDetails = async (req, res) => {
    try {
        const { invoiceCount, reportCount } = req.body;

        // Optional: Prevent creating more than one document
        const existingDetails = await CommonDetails.findOne();
        if (existingDetails) {
            return res.status(409).send({
                success: false,
                message: "Common details already exist. Use update instead.",
            });
        }

        const newCommonDetails = new CommonDetails({
            invoiceCount: invoiceCount || 0,
            reportCount: reportCount || 0,
        });

        await newCommonDetails.save();

        res.status(201).send({
            success: true,
            message: "Common details created successfully",
            commonDetails: newCommonDetails,
        });
    } catch (error) {
        console.error("Error in creating common details:", error);
        res.status(500).send({
            success: false,
            message: "Error in creating common details",
            error,
        });
    }
};

// Get Common Details (fetches the single document)
export const getCommonDetails = async (req, res) => {
    try {
        const commonDetails = await CommonDetails.findOne(); // Assuming only one document
        if (!commonDetails) {
            return res.status(404).send({
                success: false,
                message: "Common details not found. Please create one first.",
            });
        }
        res.status(200).send({
            success: true,
            message: "Common details fetched successfully",
            commonDetails,
        });
    } catch (error) {
        console.error("Error in getting common details:", error);
        res.status(500).send({
            success: false,
            message: "Error in getting common details",
            error,
        });
    }
};

// Update Common Details (updates the single document)
export const updateCommonDetails = async (req, res) => {
    try {
        const { invoiceCount, reportCount, globalInvoiceFormat, fromMail } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        if (invoiceCount !== undefined) updateData.invoiceCount = invoiceCount;
        if (reportCount !== undefined) updateData.reportCount = reportCount;
        if (globalInvoiceFormat !== undefined) updateData.globalInvoiceFormat = globalInvoiceFormat;
        if (fromMail !== undefined) updateData.fromMail = fromMail;

        // If globalInvoiceFormat is being updated, extract the starting number from it
        // and sync the invoiceCount to match the format's starting number
        // This ensures the count always matches what the format indicates
        if (globalInvoiceFormat !== undefined) {
            // Extract the last number sequence from the format (e.g., "00001" from "CC/26-27/00001")
            const lastNumberMatch = globalInvoiceFormat.match(/(\d+)(?!.*\d)/);
            if (lastNumberMatch) {
                const startingNumber = parseInt(lastNumberMatch[1]);
                
                // Always sync the count to match the format's starting number
                // unless invoiceCount is explicitly provided (user override)
                if (invoiceCount === undefined && startingNumber > 0) {
                    const currentDetails = await CommonDetails.findOne({});
                    if (currentDetails) {
                        const currentCount = currentDetails.invoiceCount || 0;
                        // Sync the count to match the format's starting number
                        // This allows resetting the count when format is updated
                        updateData.invoiceCount = startingNumber;
                        console.log(`[Common Details] Syncing invoice count from format: ${startingNumber} (was ${currentCount})`);
                    } else {
                        // If no existing details, use the starting number from format
                        updateData.invoiceCount = startingNumber;
                        console.log(`[Common Details] Initializing invoice count from format: ${startingNumber}`);
                    }
                } else if (invoiceCount !== undefined) {
                    // If invoiceCount is explicitly provided, use it (user override)
                    console.log(`[Common Details] Using explicitly provided invoice count: ${invoiceCount}`);
                }
            }
        }

        // Find the single document and update it
        const updatedDetails = await CommonDetails.findOneAndUpdate(
            {}, // Empty filter to find the first (and ideally only) document
            { $set: updateData },
            { new: true, runValidators: true, upsert: true } // upsert: true creates if not found
        );

        res.status(200).send({
            success: true,
            message: "Common details updated successfully",
            commonDetails: updatedDetails,
        });
    } catch (error) {
        console.error("Error in updating common details:", error);
        res.status(500).send({
            success: false,
            message: "Error in updating common details",
            error,
        });
    }
};

// Increment Invoice Count
export const incrementInvoiceCount = async (req, res) => {
    try {
        const updatedDetails = await CommonDetails.findOneAndUpdate(
            {}, // Find the single document
            { $inc: { invoiceCount: 1 } }, // Increment invoiceCount by 1
            { new: true, upsert: true } // Create if not found, return updated document
        );

        res.status(200).send({
            success: true,
            message: "Invoice count incremented successfully",
            commonDetails: updatedDetails,
        });
    } catch (error) {
        console.error("Error in incrementing invoice count:", error);
        res.status(500).send({
            success: false,
            message: "Error in incrementing invoice count",
            error,
        });
    }
};

// Increment Report Count
export const incrementReportCount = async (req, res) => {
    try {
        const updatedDetails = await CommonDetails.findOneAndUpdate(
            {}, // Find the single document
            { $inc: { reportCount: 1 } }, // Increment reportCount by 1
            { new: true, upsert: true } // Create if not found, return updated document
        );

        res.status(200).send({
            success: true,
            message: "Report count incremented successfully",
            commonDetails: updatedDetails,
        });
    } catch (error) {
        console.error("Error in incrementing report count:", error);
        res.status(500).send({
            success: false,
            message: "Error in incrementing report count",
            error,
        });
    }
};