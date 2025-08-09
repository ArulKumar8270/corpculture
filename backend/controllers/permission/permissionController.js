import Permission from "../../models/permissionModel.js";

// Create a new Permission entry
export const createPermission = async (req, res) => {
  try {
    const { name, key, parentKey, actions, sectionType } = req.body;

    // Basic validation
    if (!name || !key || !Array.isArray(actions)) {
      return res.status(400).send({ success: false, message: 'Name, Key, and Actions array are required.' });
    }

    // Check if key already exists
    const existingPermission = await Permission.findOne({ key });
    if (existingPermission) {
      return res.status(409).send({ success: false, message: 'Permission with this key already exists.' });
    }

    const newPermission = new Permission({
      name,
      key,
      parentKey: parentKey || null, // Ensure parentKey is null if not provided
      actions,
      sectionType: sectionType || null,
    });

    await newPermission.save();
    res.status(201).send({ success: true, message: 'Permission entry created successfully.', permission: newPermission });
  } catch (error) {
    console.error("Error in createPermission:", error);
    res.status(500).send({ success: false, message: 'Error creating permission entry.', error });
  }
};

// Get all Permission entries
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find({}).sort({ key: 1 }); // Sort by key for consistent order
    res.status(200).send({ success: true, message: 'All permission entries fetched.', permissions });
  } catch (error) {
    console.error("Error in getAllPermissions:", error);
    res.status(500).send({ success: false, message: 'Error fetching all permission entries.', error });
  }
};

// Get a single Permission entry by key
export const getPermissionByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const permission = await Permission.findOne({ userId:key });

    if (!permission) {
      return res.status(404).send({ success: false, message: 'Permission entry not found.' });
    }
    res.status(200).send({ success: true, message: 'Permission entry fetched successfully.', permission });
  } catch (error) {
    console.error("Error in getPermissionByKey:", error);
    res.status(500).send({ success: false, message: 'Error fetching permission entry.', error });
  }
};

// Update a Permission entry by key
export const updatePermission = async (req, res) => {
  try {
    const { key } = req.params;
    const { name, parentKey, actions, sectionType } = req.body;

    // Basic validation for update
    if (!name || !Array.isArray(actions)) {
      return res.status(400).send({ success: false, message: 'Name and Actions array are required for update.' });
    }

    const updatedPermission = await Permission.findOneAndUpdate(
      { key },
      { name, parentKey: parentKey || null, actions, sectionType: sectionType || null },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedPermission) {
      return res.status(404).send({ success: false, message: 'Permission entry not found for update.' });
    }
    res.status(200).send({ success: true, message: 'Permission entry updated successfully.', permission: updatedPermission });
  } catch (error) {
    console.error("Error in updatePermission:", error);
    res.status(500).send({ success: false, message: 'Error updating permission entry.', error });
  }
};

// Delete a Permission entry by key
export const deletePermission = async (req, res) => {
  try {
    const { key } = req.params;
    const deletedPermission = await Permission.findOneAndDelete({ key });

    if (!deletedPermission) {
      return res.status(404).send({ success: false, message: 'Permission entry not found for deletion.' });
    }
    res.status(200).send({ success: true, message: 'Permission entry deleted successfully.' });
  } catch (error) {
    console.error("Error in deletePermission:", error);
    res.status(500).send({ success: false, message: 'Error deleting permission entry.', error });
  }
};

// New function to update multiple permissions based on a payload
export const updatePermissionsBatch = async (req, res) => {
  try {
    const { userId, permissions: permissionsPayload } = req.body;

    if (!userId) {
      return res.status(400).send({
        success: false,
        message: 'Missing userId in request body.'
      });
    }

    if (!permissionsPayload || typeof permissionsPayload !== 'object') {
      return res.status(400).send({
        success: false,
        message: 'Invalid permissions payload provided.'
      });
    }

    const updateResults = {};
    const errors = [];

    for (const key in permissionsPayload) {
      if (Object.prototype.hasOwnProperty.call(permissionsPayload, key)) {
        const actionStatus = permissionsPayload[key];

        const actionsToSet = Object.keys(actionStatus).filter(
          (action) => actionStatus[action] === true
        );

        try {
          // Check if permission exists
          const existing = await Permission.findOne({ userId: userId, key });

          if (existing) {
            // Update existing
            existing.actions = actionsToSet;
            await existing.save();

            updateResults[key] = {
              success: true,
              message: 'Permission updated.',
              permission: existing
            };
          } else {
            // Create new
            const newPermission = new Permission({
              userId,
              key,
              name: key, // Optional: Use a better label if you want
              actions: actionsToSet
            });

            await newPermission.save();

            updateResults[key] = {
              success: true,
              message: 'Permission created.',
              permission: newPermission
            };
          }
        } catch (error) {
          console.error(`Error updating/creating permission for key '${key}':`, error);
          updateResults[key] = {
            success: false,
            message: 'Error updating/creating permission.',
            error: error.message
          };
          errors.push(
            `Error for key '${key}': ${error.message}`
          );
        }
      }
    }

    if (errors.length > 0) {
      return res.status(207).send({
        success: false,
        message: 'Some permissions failed to update/create.',
        results: updateResults,
        errors
      });
    }

    res.status(200).send({
      success: true,
      message: 'All permissions updated or created successfully.',
      results: updateResults
    });
  } catch (error) {
    console.error('Batch permission update error:', error);
    res.status(500).send({
      success: false,
      message: 'Server error while processing permissions.',
      error: error.message
    });
  }
};

// Get Permissions by User ID
export const getPermissionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from URL parameters

    if (!userId) {
      return res.status(400).send({ success: false, message: 'User ID is required.' });
    }

    const permissions = await Permission.find({ userId: userId }).sort({ key: 1 });

    if (!permissions || permissions.length === 0) {
      return res.status(404).send({ success: false, message: 'No permissions found for this user ID.' });
    }

    res.status(200).send({ success: true, message: 'Permissions fetched successfully for user.', permissions });
  } catch (error) {
    console.error("Error in getPermissionsByUserId:", error);
    res.status(500).send({ success: false, message: 'Error fetching permissions by user ID.', error });
  }
};
