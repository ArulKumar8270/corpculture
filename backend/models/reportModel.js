import mongoose from "mongoose";
import { normalizeSendDetailsTo } from "../utils/normalizeSendDetailsTo.js";

// Schema for individual material items within a report
const materialSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    // Per-product fields (requested): keep optional for backward compatibility
    serialNo: {
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
    serialNo: {
        type: String,
        trim: true,
    },
    products: [materialSchema], // Array of material items within this group
}, { _id: false }); // _id: false to prevent Mongoose from adding _id to subdocuments

// Main Report Schema
const reportSchema = new mongoose.Schema({
    reportNumber: {
        type: Number,
        unique: true,
        sparse: true,
        min: 1,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
    },
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
    companyId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
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
    accessories: {
        type: String,
        trim: true,
    },
    /** Service / Product / Service + Product — required for DC Copy; optional for Gate Pass */
    contentScope: {
        type: String,
        enum: ['Service', 'Product', 'Service + Product'],
        trim: true,
    },
    modelNo: {
        type: String,
        trim: true,
    },
    serialNo: {
        type: String,
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
    // Recipients to send report/invoice to (stored as normalized { name, email, mobile }[])
    // Mixed keeps legacy string / string[] documents readable until re-saved.
    sendDetailsTo: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
    },
    // Note: You had 'reportType' defined twice. I'm assuming the first one is correct.
    // If the second 'reportType' was intended for something else, please clarify.
    materialGroups: [materialGroupSchema], // Array of embedded material group documents
    reportLink: {
        type: [String],
        trim: true,
        default: [],
    },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

function coerceSendDetailsToOnDoc(doc) {
    if (doc == null || doc.sendDetailsTo === undefined) return;
    doc.sendDetailsTo = normalizeSendDetailsTo(doc.sendDetailsTo);
}

reportSchema.pre("save", function (next) {
    if (this.sendDetailsTo === undefined) return next();
    this.sendDetailsTo = normalizeSendDetailsTo(this.sendDetailsTo);
    next();
});

reportSchema.post("find", function (docs) {
    if (!Array.isArray(docs)) return;
    for (const d of docs) coerceSendDetailsToOnDoc(d);
});

reportSchema.post("findOne", function (doc) {
    coerceSendDetailsToOnDoc(doc);
});

export default mongoose.model('Report', reportSchema);