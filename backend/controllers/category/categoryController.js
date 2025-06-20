import Category from "../../models/categoryModel.js";
// Create Category
export const createCategory = async (req, res) => {
    try {
        const { name, commission } = req.body;
        if (!name) {
            return res.status(400).send({ success: false, message: 'Category name is required' });
        }
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(409).send({ success: false, message: 'Category already exists' });
        }
        const newCategory = await new Category({ name, commission }).save();
        res.status(201).send({ success: true, message: 'Category created successfully', category: newCategory });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error in creating category', error });
    }
};

// Get All Categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).send({ success: true, message: 'All categories fetched', categories });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error in getting all categories', error });
    }
};

// Get Single Category
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send({ success: false, message: 'Category not found' });
        }
        res.status(200).send({ success: true, message: 'Category fetched successfully', category });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error in getting category', error });
    }
};

// Update Category
export const updateCategory = async (req, res) => {
    try {
        const { name, commission } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, commission },
            { new: true, runValidators: true }
        );
        if (!category) {
            return res.status(404).send({ success: false, message: 'Category not found' });
        }
        res.status(200).send({ success: true, message: 'Category updated successfully', category });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error in updating category', error });
    }
};

// Delete Category
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).send({ success: false, message: 'Category not found' });
        }
        res.status(200).send({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error in deleting category', error });
    }
};