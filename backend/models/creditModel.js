import mongoose from "mongoose";

const creditSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    creditType: {
        type: String,
        enum: ['Given', 'Used', 'Adjusted'],
        default: 'Given'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster queries
creditSchema.index({ companyId: 1 });
creditSchema.index({ createdAt: -1 });

export default mongoose.model("Credit", creditSchema);
