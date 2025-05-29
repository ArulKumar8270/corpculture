import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: "Orders",
        required: true
    },
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    items: [{
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'cancelled'],
        default: 'draft'
    },
    dueDate: {
        type: Date,
        required: true
    },
    notes: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);