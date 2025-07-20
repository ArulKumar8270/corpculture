// Assuming you have a userModel imported at the top of your userController.js
import userModel from "../../models/userModel.js";

// ... existing user controller functions (e.g., register, login, updateProfile, etc.)

// New function to update a user's specific permissions
export const updateUserPermissions = async (req, res) => {
    try {
        const { userId } = req.params; // Get the user ID from the URL parameter
        const { permissions: permissionsPayload } = req.body; // Get the 'permissions' object from the request body

        if (!permissionsPayload || typeof permissionsPayload !== 'object') {
            return res.status(400).send({ success: false, message: 'Invalid permissions payload provided.' });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).send({ success: false, message: 'User not found.' });
        }

        // Update the userPermissions field with the new payload
        // This will overwrite the entire userPermissions object for the user
        user.userPermissions = permissionsPayload;

        await user.save(); // Save the updated user document

        res.status(200).send({ success: true, message: 'User permissions updated successfully.', userPermissions: user.userPermissions });

    } catch (error) {
        console.error("Error in updateUserPermissions:", error);
        res.status(500).send({ success: false, message: 'Error updating user permissions.', error });
    }
};