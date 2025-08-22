import mongoose from "mongoose";

// Schema for individual material items within a report
const materialSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false }); // _id: false to prevent Mongoose from adding _id to subdocuments

// New Schema for material groups
const materialGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    products: [materialSchema], // Array of material items within this group
}, { _id: false }); // _id: false to prevent Mongoose from adding _id to subdocuments

// Main Report Schema
const reportSchema = new mongoose.Schema({
    reportType: {
        type: String,
        required: true,
        trim: true,
    },
    reportFor: {
        type: String,
        trim: true,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Reference to the Company model
        required: true,
    },
    problemReport: {
        type: String,
        required: true,
        trim: true,
    },
    remarksPendingWorks: {
        type: String,
        trim: true,
    },
    accessService: {
        type: String,
        trim: true,
    },
    modelNo: {
        type: String,
        required: true,
        trim: true,
    },
    serialNo: {
        type: String,
        required: true,
        trim: true,
    },
    branch: {
        type: String,
        required: true,
        trim: true,
    },
    reference: {
        type: String,
        trim: true,
    },
    usageData: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        trim: true,
    },
    // Note: You had 'reportType' defined twice. I'm assuming the first one is correct.
    // If the second 'reportType' was intended for something else, please clarify.
    materialGroups: [materialGroupSchema], // Array of embedded material group documents
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

export default mongoose.model('Report', reportSchema);