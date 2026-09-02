import Material from '../../models/materialModel.js';
import { softDeleteById, restoreById, getTrashListQuery, mapWithRecordStatus, withRecordStatus, TRASH_SUCCESS_MESSAGE, RESTORE_SUCCESS_MESSAGE } from '../../utils/softDelete.js';

// Create a new material
export const createMaterial = async (req, res) => {
    try {
        const { name, unit, description } = req.body;

        // Check if material with same name already exists
        const existingMaterial = await Material.findOne({ name });
        if (existingMaterial) {
            return res.status(400).json({
                success: false,
                message: 'Material with this name already exists'
            });
        }

        // Create new material
        const material = await Material.create({
            name,
            unit,
            description,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Material created successfully',
            material
        });
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating material',
            error: error.message
        });
    }
};

// Get all materials
export const getAllMaterials = async (req, res) => {
    try {
        const { filter, options } = getTrashListQuery(req);
        const materials = await Material.find(filter)
            .setOptions(options)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: materials.length,
            materials: mapWithRecordStatus(materials)
        });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching materials',
            error: error.message
        });
    }
};

// Get single material by ID
export const getMaterialById = async (req, res) => {
    try {
        const material = await Material.findOne({ name: req.params.name });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        res.status(200).json({
            success: true,
            material
        });
    } catch (error) {
        console.error('Error fetching material:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching material',
            error: error.message
        });
    }
};

// Update material
export const updateMaterial = async (req, res) => {
    try {
        const { name, unit, description } = req.body;

        // Check if material exists
        let material = await Material.findOne({ name: req.params.name });
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Check if another material with the same name exists (excluding current one)
        if (name && name !== material.name) {
            const existingMaterial = await Material.findOne({name});
            if (existingMaterial) {
                return res.status(400).json({
                    success: false,
                    message: 'Material with this name already exists'
                });
            }
        }

        // Update material - convert unit to number for calculation, then back to string
        // Allow negative units to be stored
        const currentUnit = Number(material.unit) || 0;
        const unitToSubtract = Number(unit) || 0;
        const newUnit = currentUnit - unitToSubtract; // Allow negative values
        
        // Update material
        material = await Material.findOneAndUpdate(
            { name: req.params.name },
            {
                name,
                unit: String(newUnit), // Convert back to string to match schema
                description,
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Material updated successfully',
            material
        });

    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating material',
            error: error.message
        });
    }
};

// Trash material (soft delete)
export const deleteMaterial = async (req, res) => {
    try {
        const material = await softDeleteById(Material, req.params.id, req.user?._id);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        await Material.findByIdAndUpdate(
            req.params.id,
            { isActive: false, updatedBy: req.user._id },
            { new: true, includeDeleted: true }
        );

        res.status(200).json({
            success: true,
            message: TRASH_SUCCESS_MESSAGE
        });
    } catch (error) {
        console.error('Error moving material to trash:', error);
        res.status(500).json({
            success: false,
            message: 'Error moving material to trash',
            error: error.message
        });
    }
};

// Restore material from trash
export const restoreMaterial = async (req, res) => {
    try {
        const restored = await restoreById(Material, req.params.id);

        if (!restored) {
            return res.status(404).json({
                success: false,
                message: 'Material not found in trash'
            });
        }

        const material = await Material.findByIdAndUpdate(
            req.params.id,
            { isActive: true, updatedBy: req.user?._id },
            { new: true, includeDeleted: true }
        );

        res.status(200).json({
            success: true,
            message: RESTORE_SUCCESS_MESSAGE,
            material: withRecordStatus(material)
        });
    } catch (error) {
        console.error('Error restoring material:', error);
        res.status(500).json({
            success: false,
            message: 'Error restoring material',
            error: error.message
        });
    }
};

// Update or create material
export const updateOrCreateMaterial = async (req, res) => {
    try {
        const { name, unit } = req.body;

        if (!name || !unit) {
            return res.status(400).json({
                success: false,
                message: 'Name and unit are required'
            });
        }

        let material = await Material.findOne({ name });

        if (material) {
            // If material exists, update its unit
            material.unit = Number(material.unit) + Number(unit);
            await material.save();
            res.status(200).json({
                success: true,
                message: 'Material unit updated successfully',
                material
            });
        } else {
            // If material does not exist, create a new one
            material = await Material.create({
                name,
                unit,
            });
            res.status(201).json({
                success: true,
                message: 'Material created successfully',
                material
            });
        }
    } catch (error) {
        console.error('Error updating or creating material:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating or creating material',
            error: error.message
        });
    }
};