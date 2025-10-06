import Material from '../../models/materialModel.js';

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
        const materials = await Material.find({ isActive: true }).populate('name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: materials.length,
            materials
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

        // Update material
        material = await Material.findOneAndUpdate(
            { name: req.params.name },
            {
                name,
                unit: material.unit - unit,
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

// Delete material (soft delete by setting isActive to false)
export const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Soft delete by setting isActive to false
        await Material.findByIdAndUpdate(
            req.params.id,
            { isActive: false, updatedBy: req.user._id },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Material deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting material',
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
            material.unit += unit;
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