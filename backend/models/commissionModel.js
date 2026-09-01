import mongoose from "mongoose";
import { softDeletePlugin } from "../plugins/softDeletePlugin.js";

const commissionSchema = new mongoose.Schema({
    commissionFrom: {
        type: String,
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
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceProduct', // Service invoice line product for per-item partner profit
    },
    rentalProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentalProduct', // Rental invoice line product for per-item commission
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


commissionSchema.plugin(softDeletePlugin);
export default mongoose.model("Commission", commissionSchema);
