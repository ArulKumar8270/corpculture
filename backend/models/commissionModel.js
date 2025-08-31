import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema({
    commissionFrom: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The user who is assigned the commission
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', // Reference to the order this commission is based on
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Reference to the company this commission is based on
    },
    salesInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesInvoice', // Reference to the sales invoice this commission is based on
    },
    serviceInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceInvoice', // Reference to the service invoice this commission is based on
    },
    rentalInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentalInvoice', // Reference to the rental invoice this commission is based on
    },
    commissionAmount: {
        type: Number,
        required: true
    },
    percentageRate: {
        type: Number,
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Commission", commissionSchema);
