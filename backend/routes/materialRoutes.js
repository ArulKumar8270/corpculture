import express from 'express';
import { requireSignIn, isAdmin } from '../middleware/authMiddleware.js';
import { 
    createMaterial, 
    getAllMaterials, 
    getMaterialById, 
    updateMaterial, 
    deleteMaterial, 
    updateOrCreateMaterial 
} from '../controllers/material/materialController.js';

const router = express.Router();

// Create a new material
router.post('/', createMaterial);

// Get all materials
router.get('/', getAllMaterials);

// Get single material by ID
router.get('/:name', getMaterialById);

// Update material
router.post('/updateMaterial/:name', updateMaterial);

// Update or create material
router.post('/update-or-create', updateOrCreateMaterial);

// Delete material
router.delete('/:id', deleteMaterial);

export default router;