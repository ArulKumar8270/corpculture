import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Material name is required'],
        trim: true
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('Material', materialSchema);