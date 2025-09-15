import userModel from "../../models/userModel.js";

// Update Details controller
export const updateDetailsController = async (req, res) => {
    try {
        // Destructure all potential fields from req.body, including _id for identification
        const { _id, name, email, phone, address, commission, pan, isCommissionEnabled, commissionCategorys, department } = req.body;

        // Find the user by _id
        const user = await userModel.findById(_id);

        if (!user) {
            return res.status(404).send({ // Changed status to 404 for "Not Found"
                success: false,
                message: "User Not Found!",
                errorType: "invalidUser",
            });
        }

        // Prepare update fields dynamically
        const updateFields = {};

        if (name !== undefined) {
            updateFields.name = name;
        }
        if (email !== undefined) {
            updateFields.email = email;
        }
        if (phone !== undefined) {
            updateFields.phone = phone;
        }
        if (address !== undefined) {
            updateFields.address = address;
        }
        if (commission !== undefined) {
            updateFields.commission = commission;
        }
        if (isCommissionEnabled !== undefined) {
            updateFields.isCommissionEnabled = isCommissionEnabled;
        }
        if (department !== undefined) {
            updateFields.department = department;
        }
        // Handle nested PAN details
        if (pan !== undefined) {
            if (pan.number !== undefined) {
                updateFields['pan.number'] = pan.number;
            }
            if (pan.name !== undefined) {
                updateFields['pan.name'] = pan.name;
            }
        }
        // Add commissionCategorys to updateFields
        if (commissionCategorys !== undefined) {
            updateFields.commissionCategorys = commissionCategorys;
        }

        // Perform a single update operation
        const updatedUser = await userModel.findByIdAndUpdate(
            _id,
            { $set: updateFields }, // Use $set to update only specified fields
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedUser) {
            return res.status(500).send({
                success: false,
                message: "Failed to update user details.",
            });
        }

        res.status(200).send({
            success: true,
            message: "User details updated successfully!",
            user: updatedUser, // Optionally send back the updated user document
        });

    } catch (error) {
        console.log("Update Details Error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in Updating Details",
            error: error.message, // Send error message for better debugging
        });
    }
};
