import mongoose from "mongoose";

const gstSchema = new mongoose.Schema({
    gstType: {
        type: String,
        required: true,
        trim: true,
    },
    gstPercentage: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

// Create non-unique index on gstType (allows duplicates)
gstSchema.index({ gstType: 1 }, { unique: false });

const GST = mongoose.models.GST || mongoose.model('GST', gstSchema);

// Function to drop unique index if it exists
export const dropGstTypeUniqueIndex = async () => {
    try {
        await GST.collection.dropIndex('gstType_1');
        console.log('Successfully dropped unique index on gstType');
    } catch (err) {
        // Index doesn't exist (error code 27) or already dropped, ignore
        if (err.code === 27) {
            console.log('gstType unique index does not exist, skipping drop');
        } else {
            console.log('Note: Could not drop gstType unique index:', err.message);
        }
    }
};

export default GST;